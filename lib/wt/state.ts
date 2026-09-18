"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import type { WatchPaper } from "./types";

const STORAGE_PREFIX = "wt-attempt:";

export interface AttemptState {
  paperId: string;
  startedAt: number;
  /** questionId -> chosen number, or null when cleared. */
  answers: Record<string, number | null>;
  currentIndex: number;
  remainingSec: number;
  paused: boolean;
  submitted: boolean;
  keyboardOnly: boolean;
}

type Action =
  | { type: "tick" }
  | { type: "answer"; questionId: string; value: number }
  | { type: "clear"; questionId: string }
  | { type: "goto"; index: number }
  | { type: "pause"; paused: boolean }
  | { type: "submit" }
  | { type: "keyboard-only"; on: boolean }
  | { type: "restore"; state: AttemptState };

function initial(paper: WatchPaper, now: number): AttemptState {
  const answers: Record<string, number | null> = {};
  for (const q of paper.questions) answers[q.id] = null;

  return {
    paperId: paper.id,
    startedAt: now,
    answers,
    currentIndex: 0,
    remainingSec: paper.timeLimitMin * 60,
    paused: false,
    submitted: false,
    keyboardOnly: true,
  };
}

function makeReducer(questionCount: number) {
  return function reducer(state: AttemptState, action: Action): AttemptState {
    switch (action.type) {
      case "restore":
        return action.state;

      case "tick": {
        if (state.paused || state.submitted) return state;
        const left = state.remainingSec - 1;
        return {
          ...state,
          remainingSec: Math.max(0, left),
          // Running out of time ends the attempt, exactly as the hall clock does.
          submitted: left <= 0 ? true : state.submitted,
        };
      }

      case "answer":
        if (state.submitted) return state;
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

      case "keyboard-only":
        return { ...state, keyboardOnly: action.on };

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

export function scoreAttempt(paper: WatchPaper, answers: Record<string, number | null>) {
  let correct = 0;
  let attempted = 0;

  for (const q of paper.questions) {
    const given = answers[q.id];
    if (given === null || given === undefined) continue;
    attempted += 1;
    if (given === q.answer) correct += 1;
  }

  return {
    total: paper.questions.length,
    attempted,
    correct,
    wrong: attempted - correct,
    accuracy: attempted ? (correct / attempted) * 100 : 0,
  };
}
