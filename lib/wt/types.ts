/**
 * Domain model for the Watch Table Test (the RRB "following directions" test).
 *
 * The candidate sees a circle carrying eight letter+number pairs, one at each
 * compass point, with a compass rose at the centre. Every question names a
 * start direction, a travel direction and an end direction, and the answer is
 * always one of the numbers inside the squares.
 */

/** The eight compass points, in clockwise order starting at the top. */
export const DIRECTIONS = [
  "N",
  "NE",
  "E",
  "SE",
  "S",
  "SW",
  "W",
  "NW",
] as const;

export type Direction = (typeof DIRECTIONS)[number];

/** How each direction is written in a question, in both exam languages. */
export const DIRECTION_NAME: Record<Direction, { en: string; hi: string }> = {
  N: { en: "North", hi: "उत्तर" },
  NE: { en: "North-East", hi: "उत्तर-पूर्व" },
  E: { en: "East", hi: "पूर्व" },
  SE: { en: "South-East", hi: "दक्षिण-पूर्व" },
  S: { en: "South", hi: "दक्षिण" },
  SW: { en: "South-West", hi: "दक्षिण-पश्चिम" },
  W: { en: "West", hi: "पश्चिम" },
  NW: { en: "North-West", hi: "उत्तर-पश्चिम" },
};

/** One position on the circle: the letter shown, and the number in its square. */
export interface WatchCell {
  direction: Direction;
  letter: string;
  /** Always 1-5, matching the five options every question offers. */
  value: number;
}

/** The complete circle. Exactly one cell per direction, in DIRECTIONS order. */
export interface WatchTable {
  /** Shown above the diagram, e.g. "No. 1". */
  label: string;
  cells: WatchCell[];
}

/** Clockwise is "right-handedly"; anticlockwise is "left-handedly". */
export type Hand = "right" | "left";

export const HAND_NAME: Record<Hand, { en: string; hi: string }> = {
  right: { en: "right-handedly", hi: "दाएं हाथ से" },
  left: { en: "left-handedly", hi: "बाएं हाथ से" },
};

export interface Bilingual {
  en: string;
  hi: string;
}

export interface WatchQuestion {
  id: string;
  /** Index into the paper's tables — the diagram this question refers to. */
  tableIndex: number;
  prompt: Bilingual;
  /** Always the five distinct numbers on the circle, in a shuffled order. */
  options: number[];
  /** The correct number. Derived, never hand-written. */
  answer: number;
  /** How the answer was reached, shown in the review screen. */
  working: Bilingual;
}

export interface WatchPaper {
  id: string;
  title: string;
  /** e.g. "Watch Table Test - 1 (Easy Level)". */
  displayName: string;
  /** The test's own clock, in minutes. */
  timeLimitMin: number;
  /**
   * The instruction screen runs its own separate clock. When it expires the
   * test opens by itself, exactly as it does in the hall.
   */
  instructionTimeLimitMin: number;
  instructions: Bilingual[];
  example: {
    table: WatchTable;
    text: Bilingual[];
  };
  tables: WatchTable[];
  questions: WatchQuestion[];
  /**
   * When an admin has uploaded a diagram, the exam shows that image instead of
   * drawing the table. The questions then come from the admin too.
   */
  imageUrl?: string;
}
