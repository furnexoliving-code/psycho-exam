/**
 * The papers the portal offers, grouped by the battery of the ALP
 * psychological test they belong to.
 *
 * Battery 2, Following Directions, has three papers that share an engine
 * and differ only in what sits around the circle. Battery 5, the
 * Perceptual Speed Test, is a different kind of paper altogether — a
 * picture to match against five — but it rides on the same table,
 * sittings, cohort and result, so it is one more category here rather
 * than a second system.
 */
export const BATTERIES = [
  { id: 2, title: "Following Directions Test", hindi: "निर्देश पालन परीक्षण" },
  { id: 5, title: "Perceptual Speed Test", hindi: "प्रत्यक्षिक गति परीक्षण" },
] as const;

/** How a paper's questions are shown and answered. */
export type PaperKind = "directions" | "figure";

export const CATEGORIES = [
  {
    id: "watch",
    battery: 2,
    kind: "directions",
    title: "Watch Table Test",
    hindi: "वॉच टेबल टेस्ट",
    blurb: "Letters and numbers around a circle, with a compass at the centre.",
  },
  {
    id: "letter",
    battery: 2,
    kind: "directions",
    title: "Letter Table Test",
    hindi: "लेटर टेबल टेस्ट",
    blurb: "Follow the directions across a table of letters.",
  },
  {
    id: "number",
    battery: 2,
    kind: "directions",
    title: "Number Table Test",
    hindi: "नंबर टेबल टेस्ट",
    blurb: "Follow the directions across a table of numbers.",
  },
  {
    id: "figure",
    battery: 5,
    kind: "figure",
    title: "Perceptual Speed Test",
    hindi: "प्रत्यक्षिक गति परीक्षण",
    blurb: "Same Figure Test: find which of the five figures is identical to the one given.",
  },
] as const satisfies readonly {
  id: string;
  battery: number;
  kind: PaperKind;
  title: string;
  hindi: string;
  blurb: string;
}[];

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export function categoryTitle(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.title ?? "Watch Table Test";
}

/** Which kind of paper a category is; unknown or missing means a watch table. */
export function categoryKind(id: string | null | undefined): PaperKind {
  return CATEGORIES.find((c) => c.id === id)?.kind ?? "directions";
}
