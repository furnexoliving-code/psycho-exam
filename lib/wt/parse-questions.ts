/**
 * The format questions are written in, one per line:
 *
 *   English question | Hindi question | 1,5,4,3,2 | 4 | Opposite
 *
 * Fields are separated by "|". The third field is the options in the order
 * they should appear; the fourth is the correct one. The fifth is an optional
 * topic, used to break the result down by what the question tests. Hindi may
 * be left empty. Lines starting with # are ignored, so a downloaded file can
 * carry a header.
 *
 * Kept out of the server-actions file because Next.js requires every export
 * from a "use server" module to be an async function.
 */

export interface ParsedQuestion {
  prompt_en: string;
  prompt_hi: string;
  options: number[];
  answer: number;
  topic: string;
}

/**
 * The largest number an option may be. The same bound applies wherever a
 * number enters — the upload, the inline editor, the diagram — and where an
 * answer arrives for marking, so no value can be accepted here and refused
 * there.
 */
export const MAX_OPTION = 1_000_000;

export function parseQuestionLines(text: string): ParsedQuestion[] {
  const out: ParsedQuestion[] = [];

  text.split("\n").forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;

    const parts = line.split("|").map((p) => p.trim());
    if (parts.length < 4) {
      throw new Error(
        `Line ${i + 1}: expected "English | Hindi | options | answer", found ${parts.length} field${parts.length === 1 ? "" : "s"}`,
      );
    }

    const [promptEn, promptHi, optionsRaw, answerRaw, topicRaw] = parts;
    if (!promptEn) throw new Error(`Line ${i + 1}: the English question is empty`);

    const options = optionsRaw
      .split(/[,\s]+/)
      .filter(Boolean)
      .map((v) => Number(v));

    if (options.some((v) => !Number.isInteger(v) || Math.abs(v) >= MAX_OPTION)) {
      throw new Error(`Line ${i + 1}: options must be whole numbers below a million, found "${optionsRaw}"`);
    }
    if (options.length < 2) {
      throw new Error(`Line ${i + 1}: needs at least two options`);
    }
    if (new Set(options).size !== options.length) {
      throw new Error(`Line ${i + 1}: the same option is listed twice`);
    }

    if (!answerRaw) throw new Error(`Line ${i + 1}: the answer is missing`);
    const answer = Number(answerRaw);
    if (!Number.isInteger(answer)) {
      throw new Error(`Line ${i + 1}: the answer "${answerRaw}" is not a number`);
    }
    if (!options.includes(answer)) {
      throw new Error(
        `Line ${i + 1}: the answer ${answer} is not among the options ${options.join(", ")}`,
      );
    }

    out.push({
      prompt_en: promptEn,
      prompt_hi: promptHi,
      options,
      answer,
      topic: (topicRaw ?? "").trim().slice(0, 60),
    });
  });

  if (out.length === 0) throw new Error("No questions found");
  return out;
}
