import type { InstructionBlock } from "./types";

/** The smallest and largest share of the column a picture may take. */
export const MIN_IMAGE_WIDTH_PCT = 10;
export const MAX_IMAGE_WIDTH_PCT = 100;

/**
 * Parses the instruction editor's text into paragraphs.
 *
 * One paragraph per line, the fields separated by bars:
 *
 *     Read every question carefully. | हर प्रश्न ध्यान से पढ़ें।
 *     Look at the picture below.     | नीचे चित्र देखें। | https://…/example.png | 60
 *
 * The third field is an optional picture shown under that paragraph, so words
 * and image travel together and cannot fall out of order. The fourth, also
 * optional, is how wide that picture is drawn as a percentage of its column;
 * left out, the picture fills the column.
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
    if (parts.length < 2 || parts.length > 4) {
      throw new Error(
        `Line ${i + 1}: expected "English | Hindi", "English | Hindi | picture link" or "English | Hindi | picture link | width %" — ${
          parts.length - 1
        } bar(s) found.`,
      );
    }

    const en = parts[0].trim();
    const hi = parts[1].trim();
    const image = (parts[2] ?? "").trim();
    const width = (parts[3] ?? "").trim();

    if (image && !/^https?:\/\//i.test(image)) {
      // Nearly always two paragraphs run together on one line: the third
      // field is then a paragraph's Hindi, not a picture. Say what to do.
      throw new Error(
        `Line ${i + 1} has a third part that is not a picture link. Each paragraph goes on its own line — English | Hindi — so press Enter before the next paragraph. Only a picture link may follow a third bar. Found: "${image.slice(0, 60)}${image.length > 60 ? "…" : ""}"`,
      );
    }
    if (width && !image) {
      throw new Error(`Line ${i + 1}: a picture width is given but there is no picture link before it.`);
    }
    // Without this a typo that drops the text leaves an invisible paragraph
    // rather than an error the admin can see.
    if (!en && !image) {
      throw new Error(`Line ${i + 1}: the English side is empty and there is no picture`);
    }

    const block: InstructionBlock = { en, hi: hi || en };
    if (image) block.image = image;
    if (width) {
      const pct = Number(width.replace(/%$/, ""));
      if (!Number.isInteger(pct) || pct < MIN_IMAGE_WIDTH_PCT || pct > MAX_IMAGE_WIDTH_PCT) {
        throw new Error(
          `Line ${i + 1}: the picture width must be a whole number from ${MIN_IMAGE_WIDTH_PCT} to ${MAX_IMAGE_WIDTH_PCT} (percent of the column). Found: "${width.slice(0, 20)}"`,
        );
      }
      // Full width is the default, so it is not written back into the text.
      if (pct !== MAX_IMAGE_WIDTH_PCT) block.imageWidthPct = pct;
    }
    out.push(block);
  });

  return out;
}

/** Turns saved paragraphs back into the editor's text. */
export function formatInstructionLines(lines: InstructionBlock[]): string {
  return lines
    .map((l) => {
      if (!l.image) return `${l.en} | ${l.hi}`;
      const base = `${l.en} | ${l.hi} | ${l.image}`;
      return l.imageWidthPct && l.imageWidthPct !== MAX_IMAGE_WIDTH_PCT
        ? `${base} | ${l.imageWidthPct}`
        : base;
    })
    .join("\n");
}
