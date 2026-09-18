/**
 * Domain model for the RRB ALP CBAT (psycho) mock exam.
 *
 * The real battery is five tests, each with its own time limit and its own
 * answer-sheet layout. Rather than one generic "question" shape we keep a
 * discriminated union per section kind, because the stimulus differs wildly
 * (a railway track map, a row of shapes, a grid of symbols, a Likert statement).
 */

export type Lang = "en" | "hi";

/** Text that always exists in both exam languages. */
export interface Bilingual {
  en: string;
  hi: string;
}

/** The five tests of the official RRB ALP aptitude battery. */
export type SectionKind =
  | "intelligence"
  | "selective-attention"
  | "spatial-scanning"
  | "personality"
  | "memory";

/**
 * Per-question status. The RRB CBAT palette carries only these three states —
 * there is no "mark for review" in this exam.
 */
export type QuestionStatus = "not-visited" | "not-answered" | "answered";

export interface Choice {
  /** Stable key stored as the answer, e.g. "A". */
  key: string;
  /** Optional label; when absent the key is rendered. */
  label?: Bilingual;
}

export interface Question {
  id: string;
  /** Shown beside the options, e.g. a station code ("MPL") or a stimulus figure. */
  prompt: Bilingual;
  /** Optional image stimulus specific to this question. */
  image?: string;
  choices: Choice[];
  /** Absent for the personality test, which is not scored against a key. */
  correct?: string;
  /**
   * Questions are grouped into blocks that share one stimulus (e.g. "Set-1
   * (Q1 - Q12)" sharing a single track map). Blocks render as one screen.
   */
  blockId: string;
}

/** A shared stimulus for a run of questions, rendered above/beside them. */
export interface Block {
  id: string;
  title?: Bilingual;
  /** The map, figure row or symbol grid the questions refer to. */
  stimulus?: Stimulus;
}

export type Stimulus =
  | { type: "image"; src: string; alt: Bilingual }
  | { type: "track-map"; map: TrackMap }
  | { type: "figure-row"; figures: string[] }
  | { type: "symbol-grid"; rows: string[][] }
  /** A single row of boxed items with positions numbered beneath. */
  | { type: "sequence"; items: string[]; showPositions?: boolean };

/**
 * A railway track map drawn as inline SVG. Real RRB papers use scanned
 * images; generating them keeps the repo free of copyrighted scans and lets
 * us re-label the same map between the study and test page.
 */
export interface TrackMap {
  /** Polylines describing the tracks, in a 0-100 viewBox coordinate space. */
  tracks: { points: [number, number][]; kind: "single" | "double" }[];
  /**
   * Station dots. `code` shows on the study page, `letter` on the test page.
   * `lx`/`ly` are label offsets from the dot, pre-computed so labels on
   * closely spaced stations do not collide.
   */
  stations: {
    x: number;
    y: number;
    code: string;
    letter: string;
    lx: number;
    ly: number;
  }[];
}

/**
 * The memory test is shown in two phases: a study page memorised under a
 * timer, then a test page where the same map is relabelled A-E.
 */
export interface StudyPhase {
  /** Seconds the study page stays on screen before the test page takes over. */
  durationSec: number;
  stimulus: Stimulus;
}

export interface Section {
  id: string;
  kind: SectionKind;
  name: Bilingual;
  /** Minutes allotted; the section auto-submits when it runs out. */
  timeLimitMin: number;
  instructions: Bilingual[];
  /** Worked example shown on the instruction page, before the timer starts. */
  example?: {
    stimulus?: Stimulus;
    text: Bilingual[];
  };
  studyPhase?: StudyPhase;
  blocks: Block[];
  questions: Question[];
  /** Personality sections are reported as a profile, not a mark. */
  scored: boolean;
}

export interface Test {
  id: string;
  name: Bilingual;
  /** Shown in the toolbar, e.g. "ALP Psycho Full Test - 1 (Free)". */
  displayName: string;
  candidate: { name: string; rollNo: string; photo?: string };
  generalInstructions: Bilingual[];
  sections: Section[];
}

/* ------------------------------------------------------------------ */
/* Runtime answer state                                                */
/* ------------------------------------------------------------------ */

export interface AnswerState {
  /** Selected choice key, or null when cleared/never answered. */
  choice: string | null;
  markedForReview: boolean;
  visited: boolean;
}

export interface SectionRuntime {
  /** False until the candidate clicks past the section's instruction page. */
  started: boolean;
  /** Seconds left on this section's own clock. */
  remainingSec: number;
  /** True once the section has been submitted or its clock expired. */
  locked: boolean;
  /** Memory sections start in "study" and flip to "test". */
  phase: "study" | "test";
  studyRemainingSec: number;
}

export interface ExamState {
  testId: string;
  startedAt: number;
  lang: Lang;
  /** Font scale driven by the A+ / A- toolbar buttons. */
  zoom: number;
  currentSectionId: string;
  currentBlockIndex: number;
  paused: boolean;
  submitted: boolean;
  answers: Record<string, AnswerState>;
  sections: Record<string, SectionRuntime>;
}

/** Derive the palette colour for a question from its answer state. */
export function statusOf(a: AnswerState | undefined): QuestionStatus {
  if (!a || !a.visited) return "not-visited";
  return a.choice ? "answered" : "not-answered";
}
