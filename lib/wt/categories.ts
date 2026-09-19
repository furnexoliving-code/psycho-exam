/**
 * The three Following Directions papers.
 *
 * They share an engine and differ only in what sits around the circle, so
 * they are one table with a category rather than three of everything.
 */
export const CATEGORIES = [
  {
    id: "watch",
    title: "Watch Table Test",
    hindi: "वॉच टेबल टेस्ट",
    blurb: "Letters and numbers around a circle, with a compass at the centre.",
  },
  {
    id: "letter",
    title: "Letter Table Test",
    hindi: "लेटर टेबल टेस्ट",
    blurb: "Follow the directions across a table of letters.",
  },
  {
    id: "number",
    title: "Number Table Test",
    hindi: "नंबर टेबल टेस्ट",
    blurb: "Follow the directions across a table of numbers.",
  },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export function categoryTitle(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.title ?? "Watch Table Test";
}
