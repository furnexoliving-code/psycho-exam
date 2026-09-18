import {
  DIRECTIONS,
  type Direction,
  type Hand,
  type WatchCell,
  type WatchQuestion,
  type WatchTable,
} from "./types";
import { phrase, solve, type QuestionKind } from "./engine";

/**
 * Builds a Watch Table paper whose every answer is computed from its diagram.
 *
 * Generation is seeded so a paper is reproducible: the same seed always yields
 * the same diagram and the same questions, which matters when a candidate
 * reloads mid-test and when an admin wants to reissue a paper.
 */

/** Small deterministic PRNG (mulberry32). Math.random is not reproducible. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The eight positions carry five distinct numbers, three of them twice — the
 * shape the printed papers use, and what gives "appears the most times" any
 * meaning.
 *
 * The option chips are the table's own distinct values, NOT a hardcoded 1-5.
 * The reference portal's worked example puts a 6 on the circle, so a paper
 * built from an admin's uploaded diagram can use any numbers at all; deriving
 * the options guarantees the answer is always among them.
 */
const VALUE_MULTISET = [1, 2, 3, 3, 4, 4, 5, 5];

export function optionValues(table: WatchTable): number[] {
  return [...new Set(table.cells.map((c) => c.value))].sort((a, b) => a - b);
}

const LETTER_POOL = "ABCDEFGHIJKLMNPQRSTUVWXYZ".split("");

export function buildTable(label: string, seed: number): WatchTable {
  const random = rng(seed);
  const letters = shuffle(LETTER_POOL, random).slice(0, DIRECTIONS.length);
  const values = shuffle(VALUE_MULTISET, random);

  const cells: WatchCell[] = DIRECTIONS.map((direction, i) => ({
    direction,
    letter: letters[i],
    value: values[i],
  }));

  return { label, cells };
}

const KINDS: QuestionKind[] = [
  "highest-frequency",
  "opposite-of-alpha-last",
  "middle-letter",
  "lowest-frequency",
  "opposite-of-alpha-first",
  "alpha-last-value",
  "alpha-first-value",
];

const HANDS: Hand[] = ["right", "left"];

interface Candidate {
  kind: QuestionKind;
  from: Direction;
  to: Direction;
  hand: Hand;
  answer: number;
  workingEn: string;
  workingHi: string;
}

/** Every well-defined question this table can pose, in a stable order. */
export function enumerateQuestions(table: WatchTable): Candidate[] {
  const out: Candidate[] = [];

  for (const kind of KINDS) {
    for (const from of DIRECTIONS) {
      for (const to of DIRECTIONS) {
        if (from === to) continue;
        for (const hand of HANDS) {
          const solved = solve(table, kind, from, to, hand);
          // solve() returns null exactly when the instance is ambiguous.
          if (!solved) continue;
          out.push({ kind, from, to, hand, ...solved });
        }
      }
    }
  }

  return out;
}

export interface GenerateOptions {
  seed: number;
  count: number;
  /** How many diagrams the paper cycles through. */
  tableCount?: number;
}

export function generateQuestions({
  seed,
  count,
  tableCount = 1,
}: GenerateOptions): { tables: WatchTable[]; questions: WatchQuestion[] } {
  const tables = Array.from({ length: tableCount }, (_, i) =>
    buildTable(`No. ${i + 1}`, seed + i * 977),
  );

  const random = rng(seed + 12345);
  const questions: WatchQuestion[] = [];
  const used = new Set<string>();
  // Answers already emitted per kind. On a given table a type like
  // "opposite the alphabetically last letter" collapses onto one or two
  // answers for most arcs, so a paper picked purely at random can be guessed
  // by answering the same number every time.
  const answersByKind = new Map<QuestionKind, number[]>();

  // Questions run in contiguous blocks per diagram — the first half on
  // diagram 1, the second on diagram 2 — not alternating. Alternating made the
  // left-hand diagram flip on every single question, and made the question
  // paper look as though Q2, Q4, Q6 were missing from each diagram's list.
  const perTable = Math.ceil(count / tables.length);

  // Within a diagram, spread the question kinds so a paper does not turn into
  // twenty variations of one idea.
  const pools = tables.map((table) => shuffle(enumerateQuestions(table), random));
  const cursors = new Array(tables.length).fill(0);
  const kindCounts = new Map<QuestionKind, number>();

  while (questions.length < count) {
    const tableIndex = Math.min(
      Math.floor(questions.length / perTable),
      tables.length - 1,
    );
    const pool = pools[tableIndex];

    let picked: Candidate | null = null;
    // Prefer a kind we have used least, to keep the mix even.
    const minUses = Math.min(
      ...KINDS.map((k) => kindCounts.get(k) ?? 0),
    );

    // Pass 0: least-used kind AND an answer that kind has not given before.
    // Pass 1: least-used kind, any answer. Pass 2: anything unused.
    for (let pass = 0; pass < 3 && !picked; pass += 1) {
      for (let i = cursors[tableIndex]; i < pool.length; i += 1) {
        const candidate = pool[i];
        const key = `${tableIndex}:${candidate.kind}:${candidate.from}:${candidate.to}:${candidate.hand}`;
        if (used.has(key)) continue;
        if (pass < 2 && (kindCounts.get(candidate.kind) ?? 0) > minUses) continue;
        if (pass === 0 && (answersByKind.get(candidate.kind) ?? []).includes(candidate.answer)) {
          continue;
        }
        picked = candidate;
        used.add(key);
        cursors[tableIndex] = i + 1;
        break;
      }
      if (!picked) cursors[tableIndex] = 0;
    }

    if (!picked) break; // The tables cannot pose any more distinct questions.

    kindCounts.set(picked.kind, (kindCounts.get(picked.kind) ?? 0) + 1);
    answersByKind.set(picked.kind, [
      ...(answersByKind.get(picked.kind) ?? []),
      picked.answer,
    ]);

    questions.push({
      id: `wt-q${questions.length + 1}`,
      tableIndex,
      topic: picked.kind,
      prompt: phrase(picked.kind, picked.from, picked.to, picked.hand),
      options: shuffle(optionValues(tables[tableIndex]), random),
      answer: picked.answer,
      working: { en: picked.workingEn, hi: picked.workingHi },
    });
  }

  return { tables, questions };
}
