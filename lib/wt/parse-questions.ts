/**
 * The format questions are written in, one per line:
 *
 *   English question | Hindi question | 1,5,4,3,2 | 4
 *
 * Fields are separated by "|". The third field is the options in the order
 * they should appear; the fourth is the correct one. Hindi may be left empty.
 * Lines starting with # are ignored, so a downloaded file can carry a header.
 *
 * Kept out of the server-actions file because Next.js requires every export
 * from a "use server" module to be an async function.
 */

export interface ParsedQuestion {
  prompt_en: string;
  prompt_hi: string;
  options: number[];
  answer: number;
}

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

    const [promptEn, promptHi, optionsRaw, answerRaw] = parts;
    if (!promptEn) throw new Error(`Line ${i + 1}: the English question is empty`);

    const options = optionsRaw
      .split(/[,\s]+/)
      .filter(Boolean)
      .map((v) => Number(v));

    if (options.some((v) => !Number.isInteger(v))) {
      throw new Error(`Line ${i + 1}: options must be whole numbers, found "${optionsRaw}"`);
    }
    if (options.length < 2) {
      throw new Error(`Line ${i + 1}: needs at least two options`);
    }
    if (new Set(options).size !== options.length) {
      throw new Error(`Line ${i + 1}: the same option is listed twice`);
    }

    const answer = Number(answerRaw);
    if (!Number.isInteger(answer)) {
      throw new Error(`Line ${i + 1}: the answer "${answerRaw}" is not a number`);
    }
    if (!options.includes(answer)) {
      throw new Error(
        `Line ${i + 1}: the answer ${answer} is not among the options ${options.join(", ")}`,
      );
    }

    out.push({ prompt_en: promptEn, prompt_hi: promptHi, options, answer });
  });

  if (out.length === 0) throw new Error("No questions found");
  return out;
}
