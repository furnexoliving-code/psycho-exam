import {
  DIRECTIONS,
  DIRECTION_NAME,
  HAND_NAME,
  type Direction,
  type Hand,
  type WatchCell,
  type WatchTable,
} from "./types";

/**
 * The Watch Table question engine.
 *
 * Every answer is COMPUTED from the table, never written by hand. Each question
 * type also carries a guard: a condition that must hold for the question to
 * have exactly one defensible answer. A generator that cannot satisfy the guard
 * discards the instance rather than shipping an ambiguous question.
 */

const N = DIRECTIONS.length; // 8

export function indexOfDirection(direction: Direction): number {
  return DIRECTIONS.indexOf(direction);
}

/** The cell sitting at a direction. Throws rather than guessing if absent. */
export function cellAt(table: WatchTable, direction: Direction): WatchCell {
  const cell = table.cells.find((c) => c.direction === direction);
  if (!cell) throw new Error(`Watch table ${table.label} has no cell at ${direction}`);
  return cell;
}

/**
 * The cells passed when travelling from `from` to `to`, INCLUSIVE of both ends.
 *
 * "Right-handedly" is clockwise — the direction the compass points run. A path
 * where from === to would be either one cell or the whole circle depending on
 * who you ask, so it is rejected outright instead of picking a reading.
 */
export function travel(
  table: WatchTable,
  from: Direction,
  to: Direction,
  hand: Hand,
): WatchCell[] {
  if (from === to) {
    throw new Error("A path must start and end at different directions");
  }

  const step = hand === "right" ? 1 : -1;
  const out: WatchCell[] = [];
  let i = indexOfDirection(from);

  // At most N steps: the walk visits each position once before returning.
  for (let guard = 0; guard <= N; guard += 1) {
    out.push(cellAt(table, DIRECTIONS[i]));
    if (DIRECTIONS[i] === to) return out;
    i = (i + step + N) % N;
  }

  throw new Error(`Path from ${from} to ${to} did not terminate`);
}

/** The position diametrically across the circle. Exact because N is even. */
export function opposite(direction: Direction): Direction {
  return DIRECTIONS[(indexOfDirection(direction) + N / 2) % N];
}

/* ------------------------------------------------------------------ */
/* Question kinds                                                      */
/* ------------------------------------------------------------------ */

export type QuestionKind =
  | "highest-frequency"
  | "lowest-frequency"
  | "opposite-of-alpha-last"
  | "opposite-of-alpha-first"
  | "middle-letter"
  | "alpha-last-value"
  | "alpha-first-value";

export interface Solved {
  answer: number;
  /** Plain-language derivation, shown when reviewing the paper. */
  workingEn: string;
  workingHi: string;
}

/**
 * Solve one question against a table, or return null when the instance is not
 * well defined. Returning null is the guard: the generator drops it and tries
 * another combination rather than shipping a question with two right answers.
 */
export function solve(
  table: WatchTable,
  kind: QuestionKind,
  from: Direction,
  to: Direction,
  hand: Hand,
): Solved | null {
  const path = travel(table, from, to, hand);
  const pathText = path.map((c) => `${c.letter}${c.value}`).join(" → ");

  switch (kind) {
    case "highest-frequency":
    case "lowest-frequency": {
      const counts = new Map<number, number>();
      for (const cell of path) counts.set(cell.value, (counts.get(cell.value) ?? 0) + 1);

      const entries = [...counts.entries()];
      // With one distinct value there is nothing to compare, and the stem
      // would read as a trick question.
      if (entries.length < 2) return null;
      const wanted =
        kind === "highest-frequency"
          ? Math.max(...entries.map(([, n]) => n))
          : Math.min(...entries.map(([, n]) => n));
      const winners = entries.filter(([, n]) => n === wanted);

      // A tie means two numbers are equally "most frequent" — not a question.
      if (winners.length !== 1) return null;

      const [value, times] = winners[0];
      const word = kind === "highest-frequency" ? "most" : "fewest";
      const wordHi = kind === "highest-frequency" ? "सबसे अधिक" : "सबसे कम";
      return {
        answer: value,
        workingEn: `Path: ${pathText}. ${value} appears ${times} time${times === 1 ? "" : "s"}, ${word} of any number in the path.`,
        workingHi: `पथ: ${pathText}. संख्या ${value} इस पथ में ${times} बार आती है, जो ${wordHi} है।`,
      };
    }

    case "alpha-last-value":
    case "alpha-first-value":
    case "opposite-of-alpha-last":
    case "opposite-of-alpha-first": {
      const letters = path.map((c) => c.letter);
      // Letters repeating would make "alphabetically last" ambiguous about
      // WHICH position is meant, which matters for the opposite variants.
      if (new Set(letters).size !== letters.length) return null;

      const wantLast = kind === "opposite-of-alpha-last" || kind === "alpha-last-value";
      const sorted = [...path].sort((a, b) => a.letter.localeCompare(b.letter));
      const picked = wantLast ? sorted[sorted.length - 1] : sorted[0];

      const takeOpposite =
        kind === "opposite-of-alpha-last" || kind === "opposite-of-alpha-first";
      const target = takeOpposite ? cellAt(table, opposite(picked.direction)) : picked;

      const order = wantLast ? "last" : "first";
      const orderHi = wantLast ? "अंतिम" : "पहला";
      return {
        answer: target.value,
        workingEn: takeOpposite
          ? `Path: ${pathText}. Alphabetically ${order} letter is ${picked.letter} at ${picked.direction}; opposite is ${target.direction} holding ${target.letter}${target.value}.`
          : `Path: ${pathText}. Alphabetically ${order} letter is ${picked.letter}, whose number is ${target.value}.`,
        workingHi: takeOpposite
          ? `पथ: ${pathText}. वर्णानुक्रम में ${orderHi} अक्षर ${picked.letter} है (${picked.direction}); उसके सामने ${target.direction} पर ${target.letter}${target.value} है।`
          : `पथ: ${pathText}. वर्णानुक्रम में ${orderHi} अक्षर ${picked.letter} है, जिसकी संख्या ${target.value} है।`,
      };
    }

    case "middle-letter": {
      // An even-length path has no single middle element.
      if (path.length % 2 === 0) return null;
      const middle = path[(path.length - 1) / 2];
      return {
        answer: middle.value,
        workingEn: `Path: ${pathText}. It has ${path.length} letters, so the middle one is ${middle.letter}, whose number is ${middle.value}.`,
        workingHi: `पथ: ${pathText}. इसमें ${path.length} अक्षर हैं, अतः मध्य अक्षर ${middle.letter} है, जिसकी संख्या ${middle.value} है।`,
      };
    }

    default:
      return null;
  }
}

/** The question wording for each kind, in both exam languages. */
export function phrase(
  kind: QuestionKind,
  from: Direction,
  to: Direction,
  hand: Hand,
): { en: string; hi: string } {
  const f = DIRECTION_NAME[from];
  const t = DIRECTION_NAME[to];
  const h = HAND_NAME[hand];

  const leadEn = `Starting from ${f.en} travel ${h.en} up to ${t.en}.`;
  const leadHi = `${f.hi} से शुरू करके ${h.hi} ${t.hi} तक जाएँ।`;

  const tail: Record<QuestionKind, { en: string; hi: string }> = {
    // Each stem names the scope it pivots on. "in the path" alone let a
    // candidate read the pivot as the whole circle, and let a number that
    // never appears count as the least frequent one.
    "highest-frequency": {
      en: "Among the numbers you pass through, which one appears the most times?",
      hi: "जिन संख्याओं से आप गुज़रे, उनमें कौन सी संख्या सबसे अधिक बार आती है?",
    },
    "lowest-frequency": {
      en: "Among the numbers you pass through, which one appears the fewest times?",
      hi: "जिन संख्याओं से आप गुज़रे, उनमें कौन सी संख्या सबसे कम बार आती है?",
    },
    "opposite-of-alpha-last": {
      en: "Among the letters you pass through, which number is opposite the alphabetically last one?",
      hi: "जिन अक्षरों से आप गुज़रे, उनमें वर्णानुक्रम के अंतिम अक्षर के सामने कौन सी संख्या है?",
    },
    "opposite-of-alpha-first": {
      en: "Among the letters you pass through, which number is opposite the alphabetically first one?",
      hi: "जिन अक्षरों से आप गुज़रे, उनमें वर्णानुक्रम के पहले अक्षर के सामने कौन सी संख्या है?",
    },
    "middle-letter": {
      en: "What is the number of the middle letter of the path?",
      hi: "पथ के मध्य अक्षर की संख्या क्या है?",
    },
    "alpha-last-value": {
      en: "Among the letters you pass through, what is the number of the alphabetically last one?",
      hi: "जिन अक्षरों से आप गुज़रे, उनमें वर्णानुक्रम के अंतिम अक्षर की संख्या क्या है?",
    },
    "alpha-first-value": {
      en: "Among the letters you pass through, what is the number of the alphabetically first one?",
      hi: "जिन अक्षरों से आप गुज़रे, उनमें वर्णानुक्रम के पहले अक्षर की संख्या क्या है?",
    },
  };

  return {
    en: `${leadEn} ${tail[kind].en}`,
    hi: `${leadHi} ${tail[kind].hi}`,
  };
}
