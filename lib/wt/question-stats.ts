import type { OptionValue } from "./types";

/** How a batch fared on one question. */
export interface QuestionStat {
  id: string;
  position: number;
  promptEn: string;
  topic: string;
  answer: OptionValue;
  /** Attempts that answered this question at all. */
  attempted: number;
  correct: number;
  /** Correct as a share of those who attempted it, not of the whole batch. */
  accuracy: number;
  /** Attempts that left it blank. */
  skipped: number;
  /** The wrong option chosen most often, and how often — the telling mistake. */
  topWrong: { option: OptionValue; count: number } | null;
}

/**
 * Works out, question by question, how a batch did.
 *
 * Accuracy is measured over the candidates who ANSWERED the question, so a
 * question everybody skipped does not look like a question everybody failed —
 * those need different teaching. The skipped count is reported beside it so
 * the difference stays visible.
 */
export function questionStats(
  questions: { id: string; position: number; promptEn: string; topic: string; answer: OptionValue }[],
  responses: Record<string, OptionValue>[],
): QuestionStat[] {
  return questions
    .map((q) => {
      let attempted = 0;
      let correct = 0;
      const wrongTally = new Map<OptionValue, number>();

      for (const sheet of responses) {
        const chosen = sheet[q.id];
        if (typeof chosen !== "number" && typeof chosen !== "string") continue;

        attempted++;
        if (chosen === q.answer) correct++;
        else wrongTally.set(chosen, (wrongTally.get(chosen) ?? 0) + 1);
      }

      let topWrong: QuestionStat["topWrong"] = null;
      for (const [option, count] of wrongTally) {
        if (!topWrong || count > topWrong.count) topWrong = { option, count };
      }

      return {
        ...q,
        attempted,
        correct,
        accuracy: attempted === 0 ? 0 : (correct / attempted) * 100,
        skipped: responses.length - attempted,
        topWrong,
      };
    })
    // Weakest first: the point of the page is what to reteach. Questions
    // nobody answered sort last rather than first, since 0% of nothing is not
    // evidence of difficulty.
    .sort((a, b) =>
      a.attempted === 0 || b.attempted === 0
        ? a.attempted === b.attempted
          ? a.position - b.position
          : b.attempted - a.attempted
        : a.accuracy - b.accuracy,
    );
}
