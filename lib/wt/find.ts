import type { WatchQuestion } from "./types";

/**
 * The Find 6 Test and the Find 9 Test (Power of Observation, 4b and 4c):
 * four groups of digits, A to D, and the candidate names the group that
 * holds the digit; when it is in more than one group the answer is E.
 * The hall gives 75 of them in 4 minutes.
 *
 * Every question is built here, as the Yes or No pairs are, from a seed:
 * the same seed and count always give the same paper. Most questions hide
 * the digit in exactly one group, spread evenly over A to D; about one in
 * six puts it in two or more, as the guideline's practice set does.
 */

export const FIND_LETTERS = ["A", "B", "C", "D"] as const;
export const FIND_OPTIONS: string[] = ["A", "B", "C", "D", "E"];
export const MORE_THAN_ONE = "E";

/** The digit a category looks for. */
export function findDigitOf(category: string): string | null {
  return category === "find6" ? "6" : category === "find9" ? "9" : null;
}

/** What the result's topic breakdown calls each answer. */
export function findTopic(answer: string): string {
  return answer === MORE_THAN_ONE ? "In more than one group (E)" : `In group ${answer}`;
}

/** Small deterministic PRNG (mulberry32), as the other generators use. */
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

/** A run of digits of the given length that never holds the digit sought. */
function groupWithout(digit: string, length: number, random: () => number): string {
  const pool = "0123456789".replace(digit, "");
  let out = "";
  for (let i = 0; i < length; i += 1) out += pool[Math.floor(random() * pool.length)];
  return out;
}

/** The same, with the digit put in once at a place not at the very start (where it is too easy to see). */
function groupWith(digit: string, length: number, random: () => number): string {
  const base = groupWithout(digit, length, random);
  const at = 1 + Math.floor(random() * (length - 1));
  return base.slice(0, at) + digit + base.slice(at + 1);
}

export interface FindItem {
  /** The four groups, in A to D order. */
  groups: string[];
  /** A to D, or E when the digit is in more than one group. */
  answer: string;
}

/** The mix of answers: each letter alike, and E about one in six. */
const ANSWERS: readonly string[] = ["A", "B", "C", "D", "A", "B", "C", "D", "A", "B", "C", "D", "A", "B", "C", "D", "E", "E", "E"];

export function buildFindItem(digit: string, random: () => number, answer = pick(ANSWERS, random)): FindItem {
  // 4 to 11 digits, weighted to the middle as the guideline's groups are.
  const length = pick([4, 5, 6, 7, 7, 8, 8, 9, 9, 10, 11], random);
  const holders = new Set<number>();
  if (answer === MORE_THAN_ONE) {
    // Two or three groups hold the digit.
    const howMany = random() < 0.7 ? 2 : 3;
    while (holders.size < howMany) holders.add(Math.floor(random() * 4));
  } else {
    holders.add(FIND_LETTERS.indexOf(answer as (typeof FIND_LETTERS)[number]));
  }
  const groups = FIND_LETTERS.map((_, i) => (holders.has(i) ? groupWith(digit, length, random) : groupWithout(digit, length, random)));
  return { groups, answer };
}

export interface FindOptions {
  seed: number;
  count: number;
}

/** A whole paper's items, in order. The same digit, seed and count always give the same items. */
export function generateFindItems(digit: string, { seed, count }: FindOptions): FindItem[] {
  const random = rng(seed);
  // The answers in the hall's proportions exactly, then shuffled: a paper
  // never comes out heavy on E by chance.
  const answers = Array.from({ length: count }, (_, i) => ANSWERS[i % ANSWERS.length]);
  for (let i = answers.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [answers[i], answers[j]] = [answers[j], answers[i]];
  }
  const out: FindItem[] = [];
  const seen = new Set<string>();
  while (out.length < count) {
    const item = buildFindItem(digit, random, answers[out.length]);
    const key = item.groups.join("/");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** The prompt an item is stored and shown as: "A 72383514   B 98734521   C 12947685   D 39587421". */
export function findPrompt(item: FindItem): string {
  return item.groups.map((g, i) => `${FIND_LETTERS[i]} ${g}`).join("   ");
}

/**
 * The prompt read back into its lettered groups; null when it is not one.
 * A group is a letter, a space, and a run of digits; two or more make a
 * question. The review and the exam screen draw them in columns.
 */
export function splitGroups(prompt: string): { letter: string; digits: string }[] | null {
  const parts = prompt.trim().split(/\s{2,}|\s*\|\s*/);
  if (parts.length < 2) return null;
  const out: { letter: string; digits: string }[] = [];
  for (const part of parts) {
    const m = /^([A-H])[.:]?\s+(\d+)$/.exec(part.trim());
    if (!m) return null;
    out.push({ letter: m[1], digits: m[2] });
  }
  return out;
}

/** The answer and its explanation, for the review screen. */
export function findWorking(digit: string, item: FindItem): { en: string; hi: string } {
  const holders = FIND_LETTERS.filter((_, i) => item.groups[i].includes(digit));
  if (holders.length === 1) {
    return {
      en: `Only group ${holders[0]} (${item.groups[FIND_LETTERS.indexOf(holders[0])]}) holds a ${digit}, so the answer is ${holders[0]}.`,
      hi: `केवल समूह ${holders[0]} (${item.groups[FIND_LETTERS.indexOf(holders[0])]}) में ${digit} है, इसलिए उत्तर ${holders[0]} है।`,
    };
  }
  return {
    en: `The ${digit} is in groups ${holders.join(" and ")}: more than one group, so the answer is E.`,
    hi: `${digit} समूह ${holders.join(" और ")} में है: एक से अधिक समूह, इसलिए उत्तर E है।`,
  };
}

/** The items as the questions a paper stores. */
export function findQuestions(digit: string, options: FindOptions, idPrefix = "fd"): WatchQuestion[] {
  return generateFindItems(digit, options).map((item, i) => ({
    id: `${idPrefix}-q${i + 1}`,
    tableIndex: 0,
    prompt: { en: findPrompt(item), hi: "" },
    options: [...FIND_OPTIONS],
    answer: item.answer,
    working: findWorking(digit, item),
    topic: findTopic(item.answer),
  }));
}
