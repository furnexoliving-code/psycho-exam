import type { WatchPaper } from "./types";
import bundled from "@/data/watch-table-1.json";

/**
 * The bundled sample paper. Admin-created papers come from Supabase; this one
 * ships with the repo so the portal works before any setup.
 */
export const SAMPLE_PAPER = bundled as unknown as WatchPaper;

export const DEFAULT_PAPER_ID = SAMPLE_PAPER.id;

export function getBundledPaper(paperId: string): WatchPaper | undefined {
  return paperId === SAMPLE_PAPER.id ? SAMPLE_PAPER : undefined;
}

/**
 * The sample's instruction paragraphs with THIS paper's timings in them.
 *
 * A paper saved without its own wording falls back to the sample's, whose
 * last paragraph names the sample's five and ten minutes — wrong for any
 * other limits, in both languages.
 */
export function defaultInstructions(
  instructionMin: number,
  testMin: number,
): WatchPaper["instructions"] {
  const sampleRead = SAMPLE_PAPER.instructionTimeLimitMin;
  const sampleTest = SAMPLE_PAPER.timeLimitMin;
  const swap = (text: string) =>
    text
      .replace(new RegExp(`\\b${sampleRead} (minutes|मिनट)`, "g"), `${instructionMin} $1`)
      .replace(new RegExp(`\\b${sampleTest} (minute|मिनट)`, "g"), `${testMin} $1`);

  return SAMPLE_PAPER.instructions.map((block) => ({
    ...block,
    en: swap(block.en),
    hi: swap(block.hi),
  }));
}

/**
 * The paper with its answer key removed, for handing to the browser.
 *
 * The exam screen is a client component, so whatever it is given is serialised
 * into the page — and `answer`, plus the `working` text that spells the answer
 * out, would both be readable in devtools during the test. Marking happens in
 * /api/watch-table/score instead, where the key stays on the server.
 */
export function withoutAnswerKey(paper: WatchPaper): WatchPaper {
  return {
    ...paper,
    questions: paper.questions.map((q) => ({
      ...q,
      answer: -1,
      working: { en: "", hi: "" },
    })),
  };
}
