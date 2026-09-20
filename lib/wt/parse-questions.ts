/**
 * The format questions are written in, one per line:
 *
 *   English question | Hindi question | 1,5,4,3,2 | 4 | Opposite
 *   English question | Hindi question | D,E,C,A,B | A | Above
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

import type { OptionValue } from "./types";

export interface ParsedQuestion {
  prompt_en: string;
  prompt_hi: string;
  options: OptionValue[];
  answer: OptionValue;
  topic: string;
}

/**
 * The largest number an option may be. The same bound applies wherever a
 * number enters — the upload, the inline editor, the diagram — and where an
 * answer arrives for marking, so no value can be accepted here and refused
 * there.
 */
export const MAX_OPTION = 1_000_000;

/** A letter label: one to three letters, as the Letter Table offers. */
const LABEL = /^[A-Za-z]{1,3}$/;

/**
 * Reads one option or answer as it was typed. A whole number stays a
 * number; a short run of letters becomes an upper-case label; anything
 * else is refused with the reason.
 */
export function parseOption(token: string): OptionValue {
  const text = token.trim();
  if (/^-?\d+$/.test(text)) {
    const n = Number(text);
    if (!Number.isInteger(n) || Math.abs(n) >= MAX_OPTION) {
      throw new Error(`"${text}" is not a whole number below a million`);
    }
    return n;
  }
  if (LABEL.test(text)) return text.toUpperCase();
  throw new Error(`"${text}" is neither a whole number nor a letter label like A or AB`);
}

/**
 * True for a value that could be an option: what the marking accepts from
 * a browser. The same rule as parseOption, applied to a value that has
 * already travelled as JSON.
 */
export function isOptionValue(value: unknown): value is OptionValue {
  if (typeof value === "number") return Number.isInteger(value) && Math.abs(value) < MAX_OPTION;
  return typeof value === "string" && LABEL.test(value) && value === value.toUpperCase();
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

    const [promptEn, promptHi, optionsRaw, answerRaw, topicRaw] = parts;
    if (!promptEn) throw new Error(`Line ${i + 1}: the English question is empty`);

    let options: OptionValue[];
    try {
      options = optionsRaw.split(/[,\s]+/).filter(Boolean).map(parseOption);
    } catch (e) {
      throw new Error(`Line ${i + 1}: ${e instanceof Error ? e.message : String(e)} — options are whole numbers (1,5,4,3,2) or letters (D,E,C,A,B)`);
    }
    if (options.length < 2) {
      throw new Error(`Line ${i + 1}: needs at least two options`);
    }
    if (new Set(options).size !== options.length) {
      throw new Error(`Line ${i + 1}: the same option is listed twice`);
    }

    if (!answerRaw) throw new Error(`Line ${i + 1}: the answer is missing`);
    let answer: OptionValue;
    try {
      answer = parseOption(answerRaw);
    } catch (e) {
      throw new Error(`Line ${i + 1}: the answer ${e instanceof Error ? e.message : String(e)}`);
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
