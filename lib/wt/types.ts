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

/**
 * One paragraph of the instruction screen.
 *
 * A paragraph may carry a picture as well as words — a worked example is often
 * easier shown than described — and the picture belongs to the paragraph
 * rather than sitting in a separate list, so the two can never fall out of
 * order.
 */
export interface InstructionBlock extends Bilingual {
  /** Public URL of a picture shown under this paragraph. */
  image?: string;
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
  /** What the question tests, used for the topic breakdown on the result. */
  topic?: string;
}

/**
 * Which controls a candidate gets. Every switch is optional; `resolveFeatures`
 * fills in the default, so adding one here needs no data migration.
 */
export interface WatchFeatures {
  showInstructionsButton?: boolean;
  showQuestionPaperButton?: boolean;
  allowPause?: boolean;
  allowFullscreen?: boolean;
  /** Turns the mouse wheel off inside the question column. */
  lockScroll?: boolean;
  /** Runs the question column wider than its panel, as the real portal does. */
  overflowQuestions?: boolean;
}

export const DEFAULT_FEATURES: Required<WatchFeatures> = {
  showInstructionsButton: true,
  showQuestionPaperButton: true,
  allowPause: true,
  allowFullscreen: true,
  lockScroll: true,
  overflowQuestions: true,
};

export function resolveFeatures(features?: WatchFeatures): Required<WatchFeatures> {
  return { ...DEFAULT_FEATURES, ...(features ?? {}) };
}

/**
 * Which parts of the result a candidate sees.
 *
 * An absent flag means shown, so a paper saved before a panel existed keeps
 * showing everything rather than silently losing sections.
 */
export interface ResultView {
  tScore?: boolean;
  /** The worked "T = 50 + 10 × …" line under the figure. */
  tScoreFormula?: boolean;
  /** Your marks · Mean · Standard deviation · Papers compared. */
  tScoreStats?: boolean;
  cutOff?: boolean;
  /** The marks half of the cut off; the T-score half can stand alone. */
  cutOffMarks?: boolean;
  rank?: boolean;
  percentile?: boolean;
  accuracy?: boolean;
  expertComment?: boolean;
  topicBreakdown?: boolean;
  timeAnalysis?: boolean;
  attemptHistory?: boolean;
  review?: boolean;
  correctAnswers?: boolean;
}

const RESULT_VIEW_DEFAULTS: Required<ResultView> = {
  tScore: true,
  // Off by default: the candidate wants the figure, not its arithmetic.
  tScoreFormula: false,
  tScoreStats: false,
  cutOff: true,
  cutOffMarks: false,
  rank: true,
  percentile: true,
  accuracy: true,
  expertComment: true,
  topicBreakdown: true,
  timeAnalysis: true,
  attemptHistory: true,
  review: true,
  correctAnswers: true,
};

export function resolveResultView(view?: ResultView): Required<ResultView> {
  return { ...RESULT_VIEW_DEFAULTS, ...(view ?? {}) };
}

export interface WatchPaper {
  id: string;
  title: string;
  /** e.g. "Watch Table Test - 1 (Easy Level)". */
  displayName: string;
  features?: WatchFeatures;
  /** The test's own clock, in minutes. */
  timeLimitMin: number;
  /**
   * The instruction screen runs its own separate clock. When it expires the
   * test opens by itself, exactly as it does in the hall.
   */
  instructionTimeLimitMin: number;
  instructions: InstructionBlock[];
  example: {
    table: WatchTable;
    text: InstructionBlock[];
  };
  tables: WatchTable[];
  questions: WatchQuestion[];
  /**
   * When an admin has uploaded a diagram, the exam shows that image instead of
   * drawing the table. The questions then come from the admin too.
   */
  imageUrl?: string;
  /**
   * How large the question text is drawn, as a multiplier. The admin sets a
   * starting point; the candidate can still nudge it during the test, exactly
   * as the real portal allows.
   */
  fontScale?: number;
  /** How wide the uploaded diagram is drawn, as a percentage of its column. */
  imageWidthPct?: number;
  /** Which parts of the result this paper shows. */
  resultView?: ResultView;
}
