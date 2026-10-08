import type { InstructionBlock, WatchQuestion } from "./types";
import { FIND6_EXAMPLE_TEXT, FIND9_EXAMPLE_TEXT, YESNO_EXAMPLE_TEXT } from "./figure-sample";
import { findDigitOf, findQuestions } from "./find";
import { yesNoQuestions } from "./yesno";

/**
 * The tests whose questions the portal builds itself, from a seed, with
 * no pictures to upload: the Yes or No Test's pairs and the Find 6 and
 * Find 9 Tests' groups of digits. One place says, per category, how many
 * the hall gives, in how many minutes and in what parts, and what the
 * instruction screen's worked example is.
 */
export interface BuiltSpec {
  /** How many questions the hall gives. */
  count: number;
  /** The hall's clock, in minutes. */
  timeMin: number;
  /** How many questions each part shows. */
  perPart: number;
  /** The worked example on the instruction screen. */
  example: InstructionBlock[];
  /** What the admin panel calls one question. */
  noun: string;
}

const SPECS: Record<string, BuiltSpec> = {
  yesno: { count: 96, timeMin: 4, perPart: 24, example: YESNO_EXAMPLE_TEXT, noun: "pair" },
  find6: { count: 75, timeMin: 4, perPart: 25, example: FIND6_EXAMPLE_TEXT, noun: "question" },
  find9: { count: 75, timeMin: 4, perPart: 25, example: FIND9_EXAMPLE_TEXT, noun: "question" },
};

/** The spec of a built test, or null for a test whose questions are uploaded. */
export function builtSpec(category: string | null | undefined): BuiltSpec | null {
  return category ? (SPECS[category] ?? null) : null;
}

export function isBuilt(category: string | null | undefined): boolean {
  return builtSpec(category) !== null;
}

/** The questions of a built test, from the seed; null for any other test. */
export function builtQuestions(category: string, seed: number, count: number): WatchQuestion[] | null {
  if (category === "yesno") return yesNoQuestions({ seed, count });
  const digit = findDigitOf(category);
  if (digit) return findQuestions(digit, { seed, count });
  return null;
}
