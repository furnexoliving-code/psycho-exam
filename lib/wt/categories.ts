/**
 * The papers the portal offers, grouped by the battery of the ALP
 * psychological test they belong to.
 *
 * Battery 2, Following Directions, has three papers that share an engine
 * and differ only in what sits around the circle. Batteries 1, 3, 4 and 5
 * are picture papers — a figure or a scene, answered by a letter or a
 * number — on one further engine, which can also show a picture to
 * memorise before the questions (Memory) or keep one on screen beside
 * them (Depth Perception, Power of Observation), and which draws a
 * question with no picture as a row of text (the Yes or No Test's pair of
 * numbers). They all ride on the same table, sittings, cohort and result,
 * so each is one more category here rather than another system.
 */
export const BATTERIES = [
  { id: 1, title: "Memory Test", hindi: "स्मृति परीक्षण" },
  { id: 2, title: "Following Directions Test", hindi: "निर्देश पालन परीक्षण" },
  { id: 3, title: "Depth Perception Test", hindi: "गहराई बोध परीक्षण" },
  { id: 4, title: "Power of Observation Test", hindi: "अवलोकन शक्ति परीक्षण" },
  { id: 5, title: "Perceptual Speed Test", hindi: "प्रत्यक्षिक गति परीक्षण" },
] as const;

/** How a paper's questions are shown and answered. */
export type PaperKind = "directions" | "figure";

export const CATEGORIES = [
  {
    id: "memory",
    battery: 1,
    kind: "figure",
    title: "Memory Test",
    hindi: "स्मृति परीक्षण",
    blurb: "A picture is shown for a fixed time, then hidden; the questions ask what was in it.",
  },
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
    id: "depth",
    battery: 3,
    kind: "figure",
    title: "Depth Perception Test",
    hindi: "गहराई बोध परीक्षण",
    blurb: "A pile of blocks stays on screen; each question asks how many blocks touch a numbered one.",
  },
  {
    id: "yesno",
    battery: 4,
    kind: "figure",
    title: "Yes or No Test",
    hindi: "हाँ या नहीं परीक्षण",
    blurb: "Two numbers side by side: Y when they are the same, N when they are not. 96 pairs in 4 minutes.",
  },
  {
    id: "find6",
    battery: 4,
    kind: "figure",
    title: "Find 6 Test",
    hindi: "6 खोजो परीक्षण",
    blurb: "Four groups of digits: which one holds a 6? In more than one, answer E. 75 questions in 4 minutes.",
  },
  {
    id: "find9",
    battery: 4,
    kind: "figure",
    title: "Find 9 Test",
    hindi: "9 खोजो परीक्षण",
    blurb: "Four groups of digits: which one holds a 9? In more than one, answer E. 75 questions in 4 minutes.",
  },
  {
    id: "observation",
    battery: 4,
    kind: "figure",
    title: "Power of Observation Test",
    hindi: "अवलोकन शक्ति परीक्षण",
    blurb: "A picture stays on screen; each question asks what can be seen in it.",
  },
  {
    id: "octagonal",
    battery: 5,
    kind: "figure",
    title: "Octagonal Test",
    hindi: "अष्टकोण परीक्षण",
    blurb: "A figure on the left and five on the right: find the identical one. 96 questions in 5 minutes.",
  },
  {
    id: "circle",
    battery: 5,
    kind: "figure",
    title: "Same Circle Test",
    hindi: "समान वृत्त परीक्षण",
    blurb: "A circle figure on the left and A to E on the right: find the exactly similar one. 60 questions in 8 minutes.",
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

/** The battery's own name, as the hall screen writes it: the name of every test in it. */
export function testNameOf(battery: number | null | undefined, fallback = ""): string {
  return BATTERIES.find((b) => b.id === battery)?.title ?? fallback;
}

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export function categoryTitle(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.title ?? "Watch Table Test";
}

/** Which kind of paper a category is; unknown or missing means a watch table. */
export function categoryKind(id: string | null | undefined): PaperKind {
  return CATEGORIES.find((c) => c.id === id)?.kind ?? "directions";
}

/**
 * Batteries kept off the student portal until the admin opens them: the
 * starting value of the switch in the admin panel (see lib/wt/visibility.ts).
 * The admin panel still shows and edits them, and an admin or editor can
 * still preview their papers; a student does not see them on the dashboard,
 * in the lists, or by typing a paper's address.
 */
export const HIDDEN_BATTERIES: readonly number[] = [1, 3, 4];
