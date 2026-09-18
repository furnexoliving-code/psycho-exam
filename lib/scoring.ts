import type { ExamState, Section, Test } from "./types";
import { statusOf } from "./types";

export interface SectionResult {
  sectionId: string;
  name: string;
  scored: boolean;
  total: number;
  attempted: number;
  correct: number;
  wrong: number;
  unattempted: number;
  /** Percentage of attempted questions answered correctly. */
  accuracy: number;
  timeTakenSec: number;
}

export interface ExamResult {
  sections: SectionResult[];
  totalQuestions: number;
  totalAttempted: number;
  totalCorrect: number;
  totalWrong: number;
  /** Personality questions are excluded — they have no answer key. */
  scoredQuestions: number;
  overallAccuracy: number;
}

function scoreSection(section: Section, state: ExamState): SectionResult {
  let correct = 0;
  let wrong = 0;
  let attempted = 0;

  for (const q of section.questions) {
    const answer = state.answers[q.id];
    if (!answer?.choice) continue;
    attempted += 1;
    if (!section.scored || q.correct === undefined) continue;
    if (answer.choice === q.correct) correct += 1;
    else wrong += 1;
  }

  const total = section.questions.length;
  const runtime = state.sections[section.id];
  const allotted = section.timeLimitMin * 60;

  return {
    sectionId: section.id,
    name: section.name.en,
    scored: section.scored,
    total,
    attempted,
    correct,
    wrong,
    unattempted: total - attempted,
    accuracy: attempted > 0 ? (correct / attempted) * 100 : 0,
    timeTakenSec: allotted - (runtime?.remainingSec ?? allotted),
  };
}

export function scoreExam(test: Test, state: ExamState): ExamResult {
  const sections = test.sections.map((s) => scoreSection(s, state));
  const scored = sections.filter((s) => s.scored);

  const totalCorrect = scored.reduce((sum, s) => sum + s.correct, 0);
  const totalWrong = scored.reduce((sum, s) => sum + s.wrong, 0);
  const scoredAttempted = scored.reduce((sum, s) => sum + s.attempted, 0);

  return {
    sections,
    totalQuestions: sections.reduce((sum, s) => sum + s.total, 0),
    totalAttempted: sections.reduce((sum, s) => sum + s.attempted, 0),
    totalCorrect,
    totalWrong,
    scoredQuestions: scored.reduce((sum, s) => sum + s.total, 0),
    overallAccuracy: scoredAttempted > 0 ? (totalCorrect / scoredAttempted) * 100 : 0,
  };
}

/** Counts for the summary shown before submitting and in the rest screen. */
export function summarise(section: Section, state: ExamState) {
  const counts = { answered: 0, notAnswered: 0, notVisited: 0 };

  for (const q of section.questions) {
    switch (statusOf(state.answers[q.id])) {
      case "answered":
        counts.answered += 1;
        break;
      case "not-answered":
        counts.notAnswered += 1;
        break;
      default:
        counts.notVisited += 1;
    }
  }

  return counts;
}

export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
