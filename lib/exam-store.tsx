"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import type { AnswerState, ExamState, Lang, Test } from "./types";

const STORAGE_PREFIX = "alp-psycho:";

type Action =
  | { type: "tick" }
  | { type: "select"; qid: string; choice: string }
  | { type: "clear"; qid: string }
  | { type: "visit"; qid: string }
  | { type: "toggle-review"; qid: string }
  | { type: "set-review"; qid: string; value: boolean }
  | { type: "goto-block"; sectionId: string; blockIndex: number }
  | { type: "goto-section"; sectionId: string }
  | { type: "lock-section"; sectionId: string }
  | { type: "start-section"; sectionId: string }
  | { type: "end-study"; sectionId: string }
  | { type: "set-lang"; lang: Lang }
  | { type: "zoom"; delta: number }
  | { type: "set-paused"; paused: boolean }
  | { type: "submit" }
  | { type: "restore"; state: ExamState };

export function initialState(test: Test): ExamState {
  const answers: Record<string, AnswerState> = {};
  for (const section of test.sections) {
    for (const q of section.questions) {
      answers[q.id] = { choice: null, markedForReview: false, visited: false };
    }
  }

  const sections: ExamState["sections"] = {};
  for (const section of test.sections) {
    sections[section.id] = {
      started: false,
      remainingSec: section.timeLimitMin * 60,
      locked: false,
      phase: section.studyPhase ? "study" : "test",
      studyRemainingSec: section.studyPhase?.durationSec ?? 0,
    };
  }

  return {
    testId: test.id,
    startedAt: Date.now(),
    lang: "en",
    zoom: 1,
    currentSectionId: test.sections[0].id,
    currentBlockIndex: 0,
    paused: false,
    submitted: false,
    answers,
    sections,
  };
}

function reducer(state: ExamState, action: Action): ExamState {
  switch (action.type) {
    case "restore":
      return action.state;

    case "tick": {
      if (state.paused || state.submitted) return state;
      const runtime = state.sections[state.currentSectionId];
      if (!runtime || runtime.locked || !runtime.started) return state;

      // The study page burns its own clock without touching the section clock,
      // matching the real test where memorisation time is granted separately.
      if (runtime.phase === "study") {
        const studyLeft = runtime.studyRemainingSec - 1;
        return {
          ...state,
          sections: {
            ...state.sections,
            [state.currentSectionId]:
              studyLeft <= 0
                ? { ...runtime, phase: "test", studyRemainingSec: 0 }
                : { ...runtime, studyRemainingSec: studyLeft },
          },
        };
      }

      const left = runtime.remainingSec - 1;
      return {
        ...state,
        sections: {
          ...state.sections,
          [state.currentSectionId]: {
            ...runtime,
            remainingSec: Math.max(0, left),
            locked: left <= 0,
          },
        },
      };
    }

    case "visit": {
      const prev = state.answers[action.qid];
      if (!prev || prev.visited) return state;
      return {
        ...state,
        answers: { ...state.answers, [action.qid]: { ...prev, visited: true } },
      };
    }

    case "select": {
      const prev = state.answers[action.qid];
      if (!prev) return state;
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.qid]: { ...prev, choice: action.choice, visited: true },
        },
      };
    }

    case "clear": {
      const prev = state.answers[action.qid];
      if (!prev) return state;
      return {
        ...state,
        answers: { ...state.answers, [action.qid]: { ...prev, choice: null } },
      };
    }

    case "toggle-review":
    case "set-review": {
      const prev = state.answers[action.qid];
      if (!prev) return state;
      const value =
        action.type === "set-review" ? action.value : !prev.markedForReview;
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.qid]: { ...prev, markedForReview: value, visited: true },
        },
      };
    }

    case "goto-block":
      return {
        ...state,
        currentSectionId: action.sectionId,
        currentBlockIndex: action.blockIndex,
      };

    case "goto-section":
      return {
        ...state,
        currentSectionId: action.sectionId,
        currentBlockIndex: 0,
      };

    case "start-section": {
      const runtime = state.sections[action.sectionId];
      if (!runtime || runtime.started) return state;
      return {
        ...state,
        sections: {
          ...state.sections,
          [action.sectionId]: { ...runtime, started: true },
        },
      };
    }

    case "lock-section":
      return {
        ...state,
        sections: {
          ...state.sections,
          [action.sectionId]: { ...state.sections[action.sectionId], locked: true },
        },
      };

    case "end-study": {
      const runtime = state.sections[action.sectionId];
      if (!runtime) return state;
      return {
        ...state,
        sections: {
          ...state.sections,
          [action.sectionId]: { ...runtime, phase: "test", studyRemainingSec: 0 },
        },
      };
    }

    case "set-lang":
      return { ...state, lang: action.lang };

    case "zoom":
      return {
        ...state,
        // Clamped so the layout never collapses at the extremes.
        zoom: Math.min(1.4, Math.max(0.8, +(state.zoom + action.delta).toFixed(2))),
      };

    case "set-paused":
      return { ...state, paused: action.paused };

    case "submit":
      return { ...state, submitted: true, paused: true };

    default:
      return state;
  }
}

interface ExamContextValue {
  test: Test;
  state: ExamState;
  dispatch: (action: Action) => void;
}

const ExamContext = createContext<ExamContextValue | null>(null);

export function ExamProvider({ test, children }: { test: Test; children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, test, initialState);
  const restored = useRef(false);

  // Restore a run in progress so a refresh mid-exam does not wipe answers.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_PREFIX + test.id);
      if (!raw) return;
      const saved = JSON.parse(raw) as ExamState;
      if (saved.testId === test.id && !saved.submitted) {
        dispatch({ type: "restore", state: saved });
      }
    } catch {
      // A corrupt or unavailable store just means we start fresh.
    }
  }, [test.id]);

  useEffect(() => {
    if (!restored.current) return;
    try {
      window.localStorage.setItem(STORAGE_PREFIX + test.id, JSON.stringify(state));
    } catch {
      // Private-mode / quota failures must not break the exam.
    }
  }, [state, test.id]);

  useEffect(() => {
    if (state.paused || state.submitted) return;
    const id = window.setInterval(() => dispatch({ type: "tick" }), 1000);
    return () => window.clearInterval(id);
  }, [state.paused, state.submitted]);

  const value = useMemo(() => ({ test, state, dispatch }), [test, state]);
  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
}

export function useExam(): ExamContextValue {
  const ctx = useContext(ExamContext);
  if (!ctx) throw new Error("useExam must be used inside <ExamProvider>");
  return ctx;
}

export function clearSaved(testId: string) {
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + testId);
  } catch {
    // Nothing to do if storage is unavailable.
  }
}
