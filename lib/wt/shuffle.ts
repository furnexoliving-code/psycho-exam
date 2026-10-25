import type { WatchFeatures, WatchPaper, WatchQuestion } from "./types";
import { resolveFeatures } from "./types";
import { mapOf, sheetOf } from "./figure-sample";

/**
 * A sitting's own order of the questions.
 *
 * With the paper's "shuffle the questions" switch on, every sitting gets
 * the questions in an order of its own, drawn from the sitting's id: the
 * same sitting always gets the same order, so a reload, a second tab or an
 * autosave picked up later shows the paper as it was, and the result shows
 * the questions as the candidate saw them. Answers are kept by question
 * id, so the order never touches the marking.
 *
 * Where the paper's parts mean something — a study screen or a map to
 * each part (the Memory Test), a table to each part (the Letter Table Test
 * Type-II), a pile or a sheet to each part (the Brick and Similarity
 * Tests) — the questions move only within their part, so every question
 * is still asked against the picture it belongs to. Elsewhere a part is
 * only a page of the list, and the whole paper is shuffled.
 */

/** A 32-bit seed from any text (FNV-1a). */
function seedOf(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** The same small generator the built tests use: one seed, one sequence. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The parts of the paper as runs of question indexes [start, end), when a
 * question must stay in its part; one run of the whole paper otherwise.
 * The runs follow the engines exactly: the Perceptual Speed engine cuts
 * the list into questionsPerPart (components/wt/FigureExam.tsx), and a
 * paper in parts on the Following Directions engine gives the last table
 * every question past it (lib/wt/db.ts toPaper).
 */
function runsOf(count: number, category: string | null | undefined, features: Required<WatchFeatures>): [number, number][] {
  const perPart = Math.max(1, Math.floor(features.questionsPerPart) || 1);
  const partImages = features.partImages.filter((url) => typeof url === "string" && url);
  if (partImages.length > 0) {
    const tables = partImages.length + 1;
    const runs: [number, number][] = [];
    for (let p = 0; p < tables; p += 1) {
      const start = p * perPart;
      if (start >= count) break;
      runs.push([start, p === tables - 1 ? count : Math.min((p + 1) * perPart, count)]);
    }
    return runs;
  }
  const partBound = features.studyTimeMin > 0 || features.studyImages.length > 0 || sheetOf(category) !== null || mapOf(category) !== null;
  if (!partBound) return [[0, count]];
  const runs: [number, number][] = [];
  for (let start = 0; start < count; start += perPart) runs.push([start, Math.min(start + perPart, count)]);
  return runs;
}

/**
 * The order of a sitting's questions, as indexes into the paper's own
 * order: the same count, kind, features and seed always give the same
 * order, on the exam page and in the marking alike.
 */
export function sittingOrder(count: number, category: string | null | undefined, features: WatchFeatures | undefined, seed: string): number[] {
  const order = Array.from({ length: count }, (_, i) => i);
  const random = rng(seedOf(seed));
  // The Brick, Similarity and map tests draw a part's pile, sheet or map
  // from its first question's picture (components/wt/FigureExam.tsx and
  // the result's review), so that question keeps its place and the rest
  // of the part moves behind it.
  const pinFirst = sheetOf(category) !== null || mapOf(category) !== null;
  for (const [start, end] of runsOf(count, category, resolveFeatures(features))) {
    const from = pinFirst ? start + 1 : start;
    for (let i = end - 1; i > from; i -= 1) {
      const j = from + Math.floor(random() * (i - from + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  }
  return order;
}

/** The items in a sitting's order. */
export function inSittingOrder<T>(items: readonly T[], order: readonly number[]): T[] {
  return order.map((i) => items[i]);
}

/**
 * The kinds whose options may change places: an option there is the
 * answer itself — how many bricks or cubes (1 to 10), which of A to D on
 * the Figure Placement Test, the value or letter a direction leads to —
 * so the order it is offered in carries no meaning. Everywhere else the
 * option points at something in the picture (A to E of a Same Figure or
 * Similarity question, A to D on a map, the groups of the Find tests, Y
 * or N) or is a picture itself, and the order is the picture's.
 */
const OPTION_SHUFFLE_KINDS: ReadonlySet<string> = new Set(["observation", "brick", "depth", "watch", "letter", "number", "letter2"]);

/** Whether the options switch does anything on this kind of paper. */
export function optionsCanShuffle(category: string | null | undefined): boolean {
  return OPTION_SHUFFLE_KINDS.has(category ?? "");
}

/** One question's options in this sitting's order, its option pictures moving with them. */
function withShuffledOptions(question: WatchQuestion, seed: string): WatchQuestion {
  const random = rng(seedOf(`${seed}:${question.id}`));
  const order = Array.from({ length: question.options.length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    ...question,
    options: inSittingOrder(question.options, order),
    ...(question.optionImages && question.optionImages.length === question.options.length ? { optionImages: inSittingOrder(question.optionImages, order) } : {}),
  };
}

/**
 * The paper as this sitting sees it: with the questions switch on, its
 * questions in the sitting's own order (each keeping its own table); with
 * the options switch on, each question's options in an order of their
 * own, on the kinds where that means something. The paper itself, with
 * both switches off.
 */
export function shuffledForSitting(paper: WatchPaper, seed: string): WatchPaper {
  const features = resolveFeatures(paper.features);
  let questions = paper.questions;
  if (features.shuffleQuestions) {
    questions = inSittingOrder(questions, sittingOrder(questions.length, paper.category, paper.features, seed));
  }
  if (features.shuffleOptions && optionsCanShuffle(paper.category)) {
    questions = questions.map((q) => withShuffledOptions(q, seed));
  }
  return questions === paper.questions ? paper : { ...paper, questions };
}
