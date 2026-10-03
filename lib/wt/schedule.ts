import type { WatchFeatures } from "./types";

/**
 * The Memory Test's timetable: for every part, a study screen, then its
 * questions, then — before the next part — a break with a summary. Read
 * off the test's elapsed time alone, so the server, the admin panel and
 * the screen all agree on where the clock has reached.
 */
export interface Schedule {
  studySec: number;
  partSec: number;
  breakSec: number;
  parts: number;
  /** study + questions + break: the length of one part's slot, in seconds. */
  slotSec: number;
  /** The whole paper, in seconds: no break after the last part. */
  totalSec: number;
}

export function scheduleOf(
  features: Required<WatchFeatures>,
  questionCount: number,
  /** The paper's clock, used for the question time when none is set. */
  limitSec: number,
): Schedule | null {
  const studySec = Math.round((features.studyTimeMin || 0) * 60);
  if (!(studySec > 0) || features.studyImages.length === 0) return null;
  const perPart = Math.max(1, Math.floor(features.questionsPerPart) || 1);
  const parts = Math.max(1, Math.ceil(questionCount / perPart));
  const breakSec = Math.max(0, Math.round((features.breakTimeMin || 0) * 60));
  const partSec =
    features.partTimeMin > 0
      ? Math.round(features.partTimeMin * 60)
      : Math.max(1, Math.floor((limitSec - parts * studySec - (parts - 1) * breakSec) / parts));
  const slotSec = studySec + partSec + breakSec;
  return { studySec, partSec, breakSec, parts, slotSec, totalSec: parts * slotSec - breakSec };
}

/** Where the clock has reached: which part, and what that part is showing. */
export function phaseAt(
  s: Schedule,
  spentSec: number,
): { part: number; phase: "study" | "questions" | "break"; leftSec: number } {
  const part = Math.min(s.parts - 1, Math.floor(Math.max(0, spentSec) / s.slotSec));
  const offset = spentSec - part * s.slotSec;
  if (offset < s.studySec) return { part, phase: "study", leftSec: s.studySec - offset };
  const questionsEnd = s.studySec + s.partSec;
  if (offset < questionsEnd || part === s.parts - 1) {
    return { part, phase: "questions", leftSec: Math.max(0, questionsEnd - offset) };
  }
  return { part, phase: "break", leftSec: Math.max(0, s.slotSec - offset) };
}

/** The clock a scheduled paper needs, in whole minutes. */
export function scheduleMinutes(
  f: { studyTimeMin?: number; partTimeMin?: number; breakTimeMin?: number; questionsPerPart?: number },
  questionCount: number,
): number {
  const perPart = Math.max(1, Math.floor(Number(f.questionsPerPart ?? 10)) || 10);
  const parts = Math.max(1, Math.ceil(questionCount / perPart));
  const total =
    parts * (Number(f.studyTimeMin ?? 0) + Number(f.partTimeMin ?? 0)) +
    (parts - 1) * Number(f.breakTimeMin ?? 0);
  return Math.max(1, Math.ceil(total));
}
