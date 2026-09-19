import type { Bilingual } from "./types";

/**
 * Parses the instruction editor's text into bilingual paragraphs.
 *
 * One paragraph per line, the two languages separated by a bar:
 *
 *     Read every question carefully. | हर प्रश्न ध्यान से पढ़ें।
 *
 * The Hindi half may be left empty — the bar still has to be there, so a line
 * that is simply missing its translation cannot be mistaken for one where the
 * bar was forgotten and the whole sentence landed in English.
 *
 * Blank lines are skipped rather than kept, so stray newlines while typing do
 * not become empty paragraphs on the instruction screen.
 */
export function parseInstructionLines(raw: string): Bilingual[] {
  const out: Bilingual[] = [];

  raw.split(/\r?\n/).forEach((line, i) => {
    const text = line.trim();
    if (!text) return;

    const parts = text.split("|");
    if (parts.length !== 2) {
      throw new Error(
        `Line ${i + 1}: expected "English | Hindi" — one bar, ${
          parts.length - 1
        } found. Leave the Hindi side empty if you do not need it.`,
      );
    }

    const en = parts[0].trim();
    const hi = parts[1].trim();
    if (!en) throw new Error(`Line ${i + 1}: the English side is empty`);

    out.push({ en, hi: hi || en });
  });

  return out;
}

/** Turns saved paragraphs back into the editor's text. */
export function formatInstructionLines(lines: Bilingual[]): string {
  return lines.map((l) => `${l.en} | ${l.hi}`).join("\n");
}
