import { resolveFeatures, type WatchFeatures, type WatchPaper } from "./types";

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
  /** An instruction screen of its own before every part but the first (the Vehicle & Signal Position Test); 0 for none. */
  instructionSec: number;
  parts: number;
  /** study + questions + break: the first part's slot, in seconds; its instructions come before the clock starts. */
  firstSlotSec: number;
  /** instructions + study + questions + break: the slot of every later part, in seconds. */
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
  const instructionSec = Math.max(0, Math.round((features.partInstructionMin || 0) * 60));
  const partSec =
    features.partTimeMin > 0
      ? Math.round(features.partTimeMin * 60)
      : Math.max(1, Math.floor((limitSec - parts * studySec - (parts - 1) * (breakSec + instructionSec)) / parts));
  const firstSlotSec = studySec + partSec + breakSec;
  const slotSec = instructionSec + firstSlotSec;
  return { studySec, partSec, breakSec, instructionSec, parts, firstSlotSec, slotSec, totalSec: firstSlotSec + (parts - 1) * slotSec - breakSec };
}

/** Where the clock has reached: which part, and what that part is showing. */
export function phaseAt(
  s: Schedule,
  spentSec: number,
): { part: number; phase: "instruction" | "study" | "questions" | "break"; leftSec: number } {
  const spent = Math.max(0, spentSec);
  let part = 0;
  let offset = spent;
  if (s.parts > 1 && spent >= s.firstSlotSec) {
    const rest = spent - s.firstSlotSec;
    part = Math.min(s.parts - 1, 1 + Math.floor(rest / s.slotSec));
    offset = rest - (part - 1) * s.slotSec;
    if (offset < s.instructionSec) return { part, phase: "instruction", leftSec: s.instructionSec - offset };
    offset -= s.instructionSec;
  }
  if (offset < s.studySec) return { part, phase: "study", leftSec: s.studySec - offset };
  const questionsEnd = s.studySec + s.partSec;
  if (offset < questionsEnd || part === s.parts - 1) {
    return { part, phase: "questions", leftSec: Math.max(0, questionsEnd - offset) };
  }
  return { part, phase: "break", leftSec: Math.max(0, s.firstSlotSec - offset) };
}

/**
 * The clock a scheduled paper needs, in whole minutes.
 *
 * With breaks (and the later parts' instruction screens), it is the
 * sitting's whole length: what the server allows.
 * Without, it is the time the candidate is told — study and questions only,
 * as the real test counts it; a break is not test time.
 */
export function scheduleMinutes(
  f: { studyTimeMin?: number; partTimeMin?: number; breakTimeMin?: number; partInstructionMin?: number; questionsPerPart?: number },
  questionCount: number,
  withBreaks = true,
): number {
  const perPart = Math.max(1, Math.floor(Number(f.questionsPerPart ?? 10)) || 10);
  const parts = Math.max(1, Math.ceil(questionCount / perPart));
  // A later part's own instruction screen is sitting time, like a break.
  const total =
    parts * (Number(f.studyTimeMin ?? 0) + Number(f.partTimeMin ?? 0)) +
    (withBreaks ? (parts - 1) * (Number(f.breakTimeMin ?? 0) + Number(f.partInstructionMin ?? 0)) : 0);
  return Math.max(1, Math.ceil(total));
}

/**
 * The time limit a paper shows the candidate: study and question time on a
 * scheduled paper, the whole clock on any other.
 */
export function shownTimeLimitMin(paper: Pick<WatchPaper, "features" | "questions" | "timeLimitMin">): number {
  const features = resolveFeatures(paper.features);
  const s = scheduleOf(features, paper.questions.length, paper.timeLimitMin * 60);
  if (!s) return paper.timeLimitMin;
  return Math.max(1, Math.ceil((s.parts * (s.studySec + s.partSec)) / 60));
}
