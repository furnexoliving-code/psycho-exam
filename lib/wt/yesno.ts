import type { WatchQuestion } from "./types";

/**
 * The Yes or No Test (Power of Observation, 4a): two numbers side by side,
 * and the candidate says whether they are the same. The hall gives 96 of
 * them in 4 minutes.
 *
 * Every pair is built here, so a paper needs no upload: the admin asks
 * for a number of questions and a seed, and the same seed always gives the
 * same paper. About half the pairs are the same. The rest differ the way
 * the guideline's own practice pairs do: one digit changed (most often),
 * two digits changed, two neighbouring digits swapped, or a digit changed
 * at the very start or end, where the eye skips it.
 */

/** The two numbers of a pair, as the prompt carries them: "48426 = 38436". */
export const PAIR_SEPARATOR = " = ";

export const YES = "Y";
export const NO = "N";
export const YESNO_OPTIONS: string[] = [YES, NO];

export type PairKind = "same" | "one-digit" | "two-digits" | "swapped" | "edge-digit";

/** What the result's topic breakdown calls each kind. */
export const PAIR_TOPIC: Record<PairKind, string> = {
  same: "Same numbers",
  "one-digit": "One digit differs",
  "two-digits": "Two digits differ",
  swapped: "Two digits swapped",
  "edge-digit": "First or last digit differs",
};

/** Small deterministic PRNG (mulberry32), as the Watch Table generator uses. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

/** A run of digits of the given length; the first may be a zero, as "051786" in the guideline is. */
function digits(length: number, random: () => number): string {
  let out = "";
  for (let i = 0; i < length; i += 1) out += String(Math.floor(random() * 10));
  return out;
}

/** The same string with one position replaced by a different digit. */
function changeDigit(s: string, at: number, random: () => number): string {
  const was = s[at];
  let next = was;
  while (next === was) next = String(Math.floor(random() * 10));
  return s.slice(0, at) + next + s.slice(at + 1);
}

export interface Pair {
  left: string;
  right: string;
  kind: PairKind;
  /** Where the two differ, 1-based from the left; empty when they are the same. */
  at: number[];
}

/** Builds one pair of the given kind from a fresh number. */
export function buildPair(kind: PairKind, random: () => number): Pair {
  // 3 to 9 digits, weighted to the middle as the guideline's pairs are.
  const length = pick([3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 9], random);
  const left = digits(length, random);
  if (kind === "same") return { left, right: left, kind, at: [] };
  if (kind === "one-digit") {
    const at = 1 + Math.floor(random() * Math.max(1, length - 2));
    return { left, right: changeDigit(left, at, random), kind, at: [at + 1] };
  }
  if (kind === "two-digits") {
    const a = Math.floor(random() * length);
    let b = a;
    while (b === a) b = Math.floor(random() * length);
    const right = changeDigit(changeDigit(left, a, random), b, random);
    return { left, right, kind, at: [a, b].sort((x, y) => x - y).map((i) => i + 1) };
  }
  if (kind === "swapped") {
    // Two neighbours that differ, so the swap shows; a number whose digits
    // are all alike cannot be swapped and becomes a one-digit change.
    const spots = Array.from({ length: length - 1 }, (_, i) => i).filter((i) => left[i] !== left[i + 1]);
    if (spots.length === 0) return { ...buildPair("one-digit", random), left };
    const i = pick(spots, random);
    const right = left.slice(0, i) + left[i + 1] + left[i] + left.slice(i + 2);
    return { left, right, kind, at: [i + 1, i + 2] };
  }
  const at = random() < 0.5 ? 0 : length - 1;
  return { left, right: changeDigit(left, at, random), kind: "edge-digit", at: [at + 1] };
}

/** The mix the guideline's practice set shows: half the same, the rest mostly one digit off. */
const MIX: readonly PairKind[] = [
  "same", "same", "same", "same", "same", "same", "same", "same", "same", "same",
  "one-digit", "one-digit", "one-digit", "one-digit", "one-digit",
  "two-digits", "two-digits",
  "swapped", "swapped",
  "edge-digit",
];

export interface YesNoOptions {
  seed: number;
  count: number;
}

/** A whole paper's pairs, in order. The same seed and count always give the same pairs. */
export function generatePairs({ seed, count }: YesNoOptions): Pair[] {
  const random = rng(seed);
  const out: Pair[] = [];
  const seen = new Set<string>();
  while (out.length < count) {
    const pair = buildPair(pick(MIX, random), random);
    // No pair twice on one paper: a repeat is a free mark.
    if (seen.has(pair.left)) continue;
    seen.add(pair.left);
    out.push(pair);
  }
  return out;
}

/** The prompt a pair is stored and shown as. */
export function pairPrompt(p: Pair): string {
  return `${p.left}${PAIR_SEPARATOR}${p.right}`;
}

/** The prompt read back into its two numbers; null when it is not a pair. */
export function splitPair(prompt: string): { left: string; right: string } | null {
  const m = /^\s*(\S+)\s*=\s*(\S+)\s*$/.exec(prompt);
  return m ? { left: m[1], right: m[2] } : null;
}

/** The answer and its explanation, for the review screen. */
export function pairWorking(p: Pair): { en: string; hi: string } {
  if (p.kind === "same") return { en: "The two numbers are exactly the same, so the answer is Y.", hi: "दोनों संख्याएँ बिल्कुल एक जैसी हैं, इसलिए उत्तर Y है।" };
  const where = p.at.map((n) => `${n}`).join(" and ");
  const whereHi = p.at.map((n) => `${n}`).join(" और ");
  const digitsLeft = p.at.map((n) => p.left[n - 1]).join(", ");
  const digitsRight = p.at.map((n) => p.right[n - 1]).join(", ");
  return {
    en: `They differ at digit ${where} from the left: ${digitsLeft} on the left, ${digitsRight} on the right. The answer is N.`,
    hi: `बाएँ से ${whereHi}वें अंक पर अंतर है: बाईं ओर ${digitsLeft}, दाईं ओर ${digitsRight}। उत्तर N है।`,
  };
}

/** The pairs as the questions a paper stores. */
export function yesNoQuestions(options: YesNoOptions, idPrefix = "yn"): WatchQuestion[] {
  return generatePairs(options).map((p, i) => ({
    id: `${idPrefix}-q${i + 1}`,
    tableIndex: 0,
    prompt: { en: pairPrompt(p), hi: "" },
    options: [...YESNO_OPTIONS],
    answer: p.kind === "same" ? YES : NO,
    working: pairWorking(p),
    topic: PAIR_TOPIC[p.kind],
  }));
}
