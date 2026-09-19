"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import type { WatchPaper } from "./types";

const STORAGE_PREFIX = "wt-attempt:";

/**
 * Where an attempt is kept in this browser. It is keyed by WHO as well as
 * which paper: on a shared institute PC, a key by paper alone handed the next
 * student who signed in the previous one's half-finished answers and clock.
 */
export function attemptStorageKey(owner: string, paperId: string): string {
  return `${STORAGE_PREFIX}${owner}:${paperId}`;
}

/** Forgets every attempt kept in this browser, whoever it belonged to. */
export function clearAttemptStorage(): void {
  try {
    const doomed: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX) || key?.startsWith("wt-history:")) doomed.push(key);
    }
    doomed.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Nothing to do.
  }
}

export interface AttemptState {
  paperId: string;
  startedAt: number;
  /**
   * Which screen the attempt is on. It lives here rather than in component
   * state because each screen runs its own clock, and both must survive a
   * reload.
   */
  phase: "instructions" | "test";
  /** questionId -> chosen number, or null when cleared. */
  answers: Record<string, number | null>;
  currentIndex: number;
  /** The instruction screen's own countdown. */
  instructionRemainingSec: number;
  /** The test's countdown. It does not start until the test opens. */
  remainingSec: number;
  paused: boolean;
  submitted: boolean;
  /**
   * True once this attempt has been counted into the paper's statistics.
   * Without it, reloading the result page would enter the same candidate into
   * the cohort again and drag the mean around.
   */
  recorded?: boolean;
  /** Free scrolling is off during the test; navigation moves the view instead. */
  scrollLocked: boolean;
  /**
   * When the clock last moved, by the wall clock. A background tab is only
   * ticked about once a minute by the browser, so counting ticks let a
   * candidate who switched tabs bank the difference; each tick now takes off
   * the time that actually passed.
   */
  lastTickAt?: number;
  /** Seconds banked by finished pauses, credited back against the server's clock. */
  pausedSec?: number;
  /** When the current pause began, by the wall clock. */
  pausedAt?: number;
}

type Action =
  | { type: "tick"; now: number }
  | { type: "answer"; questionId: string; value: number }
  | { type: "clear"; questionId: string }
  | { type: "goto"; index: number }
  | { type: "begin-test" }
  | { type: "pause"; paused: boolean; now: number }
  | { type: "submit" }
  | { type: "scroll-lock"; on: boolean }
  | { type: "restore"; state: AttemptState };

function initial(paper: WatchPaper, now: number): AttemptState {
  const answers: Record<string, number | null> = {};
  for (const q of paper.questions) answers[q.id] = null;

  return {
    paperId: paper.id,
    startedAt: now,
    phase: "instructions",
    answers,
    currentIndex: 0,
    instructionRemainingSec: paper.instructionTimeLimitMin * 60,
    remainingSec: paper.timeLimitMin * 60,
    paused: false,
    submitted: false,
    scrollLocked: true,
  };
}

function makeReducer(questionCount: number) {
  return function reducer(state: AttemptState, action: Action): AttemptState {
    switch (action.type) {
      case "restore":
        return action.state;

      case "tick": {
        if (state.paused || state.submitted) return state;

        // Seconds actually passed since the last tick — one when the tab is in
        // front, more when the browser throttled it in the background.
        const passed = state.lastTickAt
          ? Math.max(1, Math.round((action.now - state.lastTickAt) / 1000))
          : 1;

        // The two screens keep separate clocks. Only the one on screen runs.
        if (state.phase === "instructions") {
          const left = state.instructionRemainingSec - passed;
          return {
            ...state,
            lastTickAt: action.now,
            instructionRemainingSec: Math.max(0, left),
            // Reading time over: the test opens by itself, as in the hall.
            phase: left <= 0 ? "test" : "instructions",
          };
        }

        const left = state.remainingSec - passed;
        return {
          ...state,
          lastTickAt: action.now,
          remainingSec: Math.max(0, left),
          // Running out of time ends the attempt, exactly as the hall clock does.
          submitted: left <= 0 ? true : state.submitted,
        };
      }

      case "begin-test":
        // One-way: there is no route back to the instruction screen.
        return state.phase === "test" ? state : { ...state, phase: "test" };

      case "answer":
        if (state.submitted || state.phase !== "test") return state;
        return {
          ...state,
          answers: { ...state.answers, [action.questionId]: action.value },
        };

      case "clear":
        if (state.submitted) return state;
        return {
          ...state,
          answers: { ...state.answers, [action.questionId]: null },
        };

      case "goto":
        return {
          ...state,
          currentIndex: Math.min(Math.max(0, action.index), questionCount - 1),
        };

      case "pause": {
        if (action.paused === state.paused) return state;
        if (action.paused) return { ...state, paused: true, pausedAt: action.now };
        // Resuming restarts the wall clock from now; the pause itself is not
        // time passed, and how long it held is banked so a reload can credit
        // it back against the server's clock, which never stopped.
        const held = state.pausedAt
          ? Math.max(0, Math.round((action.now - state.pausedAt) / 1000))
          : 0;
        return {
          ...state,
          paused: false,
          lastTickAt: undefined,
          pausedAt: undefined,
          pausedSec: (state.pausedSec ?? 0) + held,
        };
      }

      case "submit":
        return { ...state, submitted: true };

      case "scroll-lock":
        return { ...state, scrollLocked: action.on };

      default:
        return state;
    }
  };
}

/**
 * Attempt state with a one-second clock and local persistence, so a refresh
 * mid-test resumes rather than starting over.
 */
export function useAttempt(
  paper: WatchPaper,
  serverElapsedSec: number | null = null,
  serverQuestionElapsedSec: number | null = null,
  /** Whose attempt this is — the signed-in account, so two students on one PC never share one. */
  owner = "guest",
) {
  const reducer = useMemo(() => makeReducer(paper.questions.length), [paper.questions.length]);
  const [state, dispatch] = useReducer(reducer, paper, (p) => initial(p, 0));
  const storageKey = attemptStorageKey(owner, paper.id);

  // Restore before the first paint that matters; startedAt is stamped here
  // rather than in the initialiser so server and client render the same thing.
  useEffect(() => {
    /**
     * The server's clock wins.
     *
     * Local storage is the candidate's own file: clearing it, or opening the
     * paper in a second tab, used to hand back a full countdown. The server
     * says how long this sitting has actually been running, so the clock can
     * only ever be that or less — never more.
     */
    const capped = (state: AttemptState): AttemptState => {
      if (serverElapsedSec === null) return state;

      const testSec = paper.timeLimitMin * 60;

      // The server's clock never pauses. Where the paper allows a pause, the
      // time this browser recorded as paused is credited back, or a reload
      // after a pause would take those minutes off the clock without a word.
      const pausedSoFar =
        (state.pausedSec ?? 0) +
        (state.paused && state.pausedAt
          ? Math.max(0, Math.round((Date.now() - state.pausedAt) / 1000))
          : 0);
      const questionElapsed =
        serverQuestionElapsedSec === null
          ? null
          : Math.max(0, serverQuestionElapsedSec - pausedSoFar);
      const elapsed = Math.max(0, serverElapsedSec - pausedSoFar);

      // The questions have already opened, by the server's record: the test
      // clock can only have what it had then, less the time since. The
      // instruction screen is behind the candidate whatever this browser
      // remembers — there is no way back to it.
      if (questionElapsed !== null) {
        const left = Math.max(0, testSec - questionElapsed);
        return {
          ...state,
          phase: "test",
          instructionRemainingSec: 0,
          remainingSec: Math.min(state.remainingSec, left),
          submitted: state.submitted || left <= 0,
        };
      }

      const total = paper.instructionTimeLimitMin * 60 + testSec;
      const left = Math.max(0, total - elapsed);

      return {
        ...state,
        instructionRemainingSec: Math.min(
          state.instructionRemainingSec,
          Math.max(0, left - testSec),
        ),
        remainingSec: Math.min(state.remainingSec, left),
        // Both clocks spent means the paper is over, whatever the browser says.
        submitted: state.submitted || left <= 0,
      };
    };

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as AttemptState;
        if (saved.paperId === paper.id && !saved.submitted) {
          dispatch({ type: "restore", state: capped({ ...saved, lastTickAt: undefined }) });
          return;
        }
        // Submitted but not yet on record: the result page has not had its
        // answer from the server. Starting afresh here would overwrite the
        // answers with blanks while the sitting is still open; keeping the
        // state sends the candidate back to the result instead.
        if (saved.paperId === paper.id && saved.submitted && saved.recorded !== true) {
          dispatch({ type: "restore", state: saved });
          return;
        }
      }
    } catch {
      // Unavailable storage just means a fresh attempt.
    }
    dispatch({ type: "restore", state: capped(initial(paper, Date.now())) });
  }, [paper, serverElapsedSec, serverQuestionElapsedSec, storageKey]);

  useEffect(() => {
    if (state.startedAt === 0) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Ignore quota and private-mode failures.
    }
  }, [state, storageKey]);

  useEffect(() => {
    if (state.paused || state.submitted || state.startedAt === 0) return;
    const id = window.setInterval(() => dispatch({ type: "tick", now: Date.now() }), 1000);
    return () => window.clearInterval(id);
  }, [state.paused, state.submitted, state.startedAt]);

  const answered = useMemo(
    () => Object.values(state.answers).filter((v) => v !== null).length,
    [state.answers],
  );

  const clearSaved = useCallback(() => {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // Nothing to do.
    }
  }, [storageKey]);

  return { state, dispatch, answered, clearSaved };
}
