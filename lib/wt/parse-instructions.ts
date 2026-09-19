import type { InstructionBlock } from "./types";

/**
 * Parses the instruction editor's text into paragraphs.
 *
 * One paragraph per line, the fields separated by bars:
 *
 *     Read every question carefully. | हर प्रश्न ध्यान से पढ़ें।
 *     Look at the picture below.     | नीचे चित्र देखें। | https://…/example.png
 *
 * The third field is an optional picture shown under that paragraph, so words
 * and image travel together and cannot fall out of order.
 *
 * The Hindi half may be left empty — the bar still has to be there, so a line
 * that is simply missing its translation cannot be mistaken for one where the
 * bar was forgotten and the whole sentence landed in English.
 *
 * A line may also be a picture on its own: leave both text fields empty and
 * give only the URL.
 *
 * Blank lines are skipped rather than kept, so stray newlines while typing do
 * not become empty paragraphs on the instruction screen.
 */
export function parseInstructionLines(raw: string): InstructionBlock[] {
  const out: InstructionBlock[] = [];

  raw.split(/\r?\n/).forEach((line, i) => {
    const text = line.trim();
    if (!text) return;

    const parts = text.split("|");
    if (parts.length < 2 || parts.length > 3) {
      throw new Error(
        `Line ${i + 1}: expected "English | Hindi" or "English | Hindi | picture link" — ${
          parts.length - 1
        } bar(s) found.`,
      );
    }

    const en = parts[0].trim();
    const hi = parts[1].trim();
    const image = (parts[2] ?? "").trim();

    if (image && !/^https?:\/\//i.test(image)) {
      throw new Error(
        `Line ${i + 1}: the picture must be a link starting with http:// or https:// — got "${image}"`,
      );
    }
    // Without this a typo that drops the text leaves an invisible paragraph
    // rather than an error the admin can see.
    if (!en && !image) {
      throw new Error(`Line ${i + 1}: the English side is empty and there is no picture`);
    }

    const block: InstructionBlock = { en, hi: hi || en };
    if (image) block.image = image;
    out.push(block);
  });

  return out;
}

/** Turns saved paragraphs back into the editor's text. */
export function formatInstructionLines(lines: InstructionBlock[]): string {
  return lines
    .map((l) => (l.image ? `${l.en} | ${l.hi} | ${l.image}` : `${l.en} | ${l.hi}`))
    .join("\n");
}
