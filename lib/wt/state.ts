"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import type { WatchPaper } from "./types";

const STORAGE_PREFIX = "wt-attempt:";

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
  /** Free scrolling is off during the test; navigation moves the view instead. */
  scrollLocked: boolean;
}

type Action =
  | { type: "tick" }
  | { type: "answer"; questionId: string; value: number }
  | { type: "clear"; questionId: string }
  | { type: "goto"; index: number }
  | { type: "begin-test" }
  | { type: "pause"; paused: boolean }
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

        // The two screens keep separate clocks. Only the one on screen runs.
        if (state.phase === "instructions") {
          const left = state.instructionRemainingSec - 1;
          return {
            ...state,
            instructionRemainingSec: Math.max(0, left),
            // Reading time over: the test opens by itself, as in the hall.
            phase: left <= 0 ? "test" : "instructions",
          };
        }

        const left = state.remainingSec - 1;
        return {
          ...state,
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

      case "pause":
        return { ...state, paused: action.paused };

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
export function useAttempt(paper: WatchPaper) {
  const reducer = useMemo(() => makeReducer(paper.questions.length), [paper.questions.length]);
  const [state, dispatch] = useReducer(reducer, paper, (p) => initial(p, 0));

  // Restore before the first paint that matters; startedAt is stamped here
  // rather than in the initialiser so server and client render the same thing.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_PREFIX + paper.id);
      if (raw) {
        const saved = JSON.parse(raw) as AttemptState;
        if (saved.paperId === paper.id && !saved.submitted) {
          dispatch({ type: "restore", state: saved });
          return;
        }
      }
    } catch {
      // Unavailable storage just means a fresh attempt.
    }
    dispatch({ type: "restore", state: initial(paper, Date.now()) });
  }, [paper]);

  useEffect(() => {
    if (state.startedAt === 0) return;
    try {
      window.localStorage.setItem(STORAGE_PREFIX + paper.id, JSON.stringify(state));
    } catch {
      // Ignore quota and private-mode failures.
    }
  }, [state, paper.id]);

  useEffect(() => {
    if (state.paused || state.submitted || state.startedAt === 0) return;
    const id = window.setInterval(() => dispatch({ type: "tick" }), 1000);
    return () => window.clearInterval(id);
  }, [state.paused, state.submitted, state.startedAt]);

  const answered = useMemo(
    () => Object.values(state.answers).filter((v) => v !== null).length,
    [state.answers],
  );

  const clearSaved = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_PREFIX + paper.id);
    } catch {
      // Nothing to do.
    }
  }, [paper.id]);

  return { state, dispatch, answered, clearSaved };
}
