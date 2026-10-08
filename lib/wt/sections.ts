import { BATTERIES, CATEGORIES } from "./categories";

/**
 * The hall's own test index: every kind of test in the ALP aptitude
 * battery, as the RDSO guideline (ALPs Guidelines CBT, Jan 2020) lists
 * it, with the question count and clock the hall gives each one. The
 * practice page shows this index whole, in this order, so a candidate
 * sees the full battery they will face and not only the papers the
 * portal has published so far.
 *
 * A paper joins a section by the series name the admin gave it; a paper
 * with no series name joins its category's usual section (a memory paper
 * is a Figure Find Test, a depth paper a Hidden Cube Test, and so on).
 * A series name that matches no section still shows, as its own card at
 * the end of its battery, so nothing an admin publishes is ever lost.
 */
export interface Section {
  /** The hall's own code: 1a … 5e. */
  code: string;
  battery: number;
  name: string;
  hindi: string;
  /** Questions in one sitting in the hall. */
  questions: number;
  /** How the hall splits them, e.g. "12 + 12" or "18 × 4"; empty when it does not. */
  questionsNote: string;
  /** The hall's clock, in minutes. */
  timeMin: number;
  /** How the hall splits the clock, e.g. "2+2+2+2"; empty when it does not. */
  timeNote: string;
  /** One line on what the candidate does, for the card. */
  blurb: string;
  blurbHi: string;
}

export const SECTIONS: readonly Section[] = [
  // 1 · Memory Test
  { code: "1a", battery: 1, name: "House Position Test", hindi: "मकान स्थिति परीक्षण", questions: 24, questionsNote: "12 + 12", timeMin: 8, timeNote: "2+2+2+2", blurb: "Memorise where each house stands on a map; then name the letter at each house's place.", blurbHi: "नक्शे में मकानों की जगह याद करें; फिर हर मकान की जगह वाला अक्षर बताएँ।" },
  { code: "1b", battery: 1, name: "Figure to Number Test", hindi: "आकृति-अंक परीक्षण", questions: 42, questionsNote: "21 + 21", timeMin: 12, timeNote: "3+3+3+3", blurb: "Memorise picture–number pairs; then pick each picture's number from four options.", blurbHi: "चित्र-अंक के जोड़े याद करें; फिर हर चित्र का अंक चार विकल्पों में से चुनें।" },
  { code: "1c", battery: 1, name: "Railway Track Route Test", hindi: "रेलवे ट्रैक रूट परीक्षण", questions: 24, questionsNote: "12 + 12", timeMin: 8, timeNote: "2+2+2+2", blurb: "Memorise the stations on a railway map; then name the letter where each station was.", blurbHi: "रेलवे मानचित्र में स्टेशनों की जगह याद करें; फिर हर स्टेशन की जगह वाला अक्षर बताएँ।" },
  { code: "1d", battery: 1, name: "Figure to Figure Test", hindi: "आकृति-आकृति परीक्षण", questions: 40, questionsNote: "20 + 20", timeMin: 12, timeNote: "3+3+3+3", blurb: "Memorise pairs of shapes; then find the shape that went with each one.", blurbHi: "आकृतियों के जोड़े याद करें; फिर हर आकृति के साथ वाली आकृति खोजें।" },
  { code: "1e", battery: 1, name: "Figure Find Test", hindi: "आकृति खोज परीक्षण", questions: 24, questionsNote: "12 + 12", timeMin: 8, timeNote: "2+2+2+2", blurb: "Memorise sets of shapes; then find each set among five options.", blurbHi: "आकृतियों के सेट याद करें; फिर हर सेट को पाँच विकल्पों में खोजें।" },
  // 2 · Following Directions Test
  { code: "2a", battery: 2, name: "Letter Table Test", hindi: "लेटर टेबल टेस्ट", questions: 10, questionsNote: "", timeMin: 5, timeNote: "", blurb: "Follow the directions across a table of letters.", blurbHi: "अक्षरों की तालिका में निर्देशों के अनुसार उत्तर खोजें।" },
  { code: "2b", battery: 2, name: "Watch Table Test", hindi: "वॉच टेबल टेस्ट", questions: 20, questionsNote: "", timeMin: 10, timeNote: "", blurb: "Letters and numbers around a circle, with a compass at the centre.", blurbHi: "गोले पर अक्षर और अंक, बीच में दिशा-सूचक।" },
  { code: "2c", battery: 2, name: "Number Table Test", hindi: "नंबर टेबल टेस्ट", questions: 10, questionsNote: "", timeMin: 5, timeNote: "", blurb: "Follow the directions across a table of numbers.", blurbHi: "अंकों की तालिका में निर्देशों के अनुसार उत्तर खोजें।" },
  // 3 · Depth Perception Test
  { code: "3a", battery: 3, name: "Brick Test", hindi: "ईंट परीक्षण", questions: 50, questionsNote: "", timeMin: 5, timeNote: "", blurb: "A pile of bricks, some lettered: count the bricks touching each lettered one.", blurbHi: "ईंटों का ढेर, कुछ पर अक्षर: हर अक्षर वाली ईंट को छूती ईंटें गिनें।" },
  { code: "3b", battery: 3, name: "Hidden Cube Test", hindi: "छिपे घन परीक्षण", questions: 50, questionsNote: "", timeMin: 10, timeNote: "", blurb: "A pile of blocks: count the blocks hidden on every side by the others.", blurbHi: "गुटकों का ढेर: हर ओर से छिपे गुटके गिनें।" },
  // 4 · Test of Power of Observation
  { code: "4a", battery: 4, name: "Yes or No Test", hindi: "हाँ या नहीं परीक्षण", questions: 96, questionsNote: "", timeMin: 4, timeNote: "", blurb: "Two numbers side by side: are they the same? Y or N, as fast as you can.", blurbHi: "दो संख्याएँ आमने-सामने: एक जैसी हैं या नहीं? Y या N, जितनी तेज़ी से हो सके।" },
  { code: "4b", battery: 4, name: "Find 6 Test", hindi: "6 खोजो परीक्षण", questions: 75, questionsNote: "", timeMin: 4, timeNote: "", blurb: "Four groups of digits: which one holds a 6? More than one, answer E.", blurbHi: "अंकों के चार समूह: किसमें 6 है? एक से अधिक में हो तो E।" },
  { code: "4c", battery: 4, name: "Find 9 Test", hindi: "9 खोजो परीक्षण", questions: 75, questionsNote: "", timeMin: 4, timeNote: "", blurb: "Four groups of digits: which one holds a 9? More than one, answer E.", blurbHi: "अंकों के चार समूह: किसमें 9 है? एक से अधिक में हो तो E।" },
  { code: "4d", battery: 4, name: "Figure Placement Test", hindi: "आकृति स्थान परीक्षण", questions: 60, questionsNote: "", timeMin: 7, timeNote: "", blurb: "Set A against set B: no difference, or two, three or four figures moved.", blurbHi: "सेट A बनाम सेट B: कोई अंतर नहीं, या दो, तीन या चार आकृतियाँ बदली हुई।" },
  // 5 · Perceptual Speed Test
  { code: "5a", battery: 5, name: "Similarity Test", hindi: "समानता परीक्षण", questions: 72, questionsNote: "18 × 4", timeMin: 6, timeNote: "", blurb: "A figure on the left: which of the five on the right is most nearly like it?", blurbHi: "बाईं ओर एक आकृति: दाईं ओर की पाँच में से कौन सबसे अधिक मिलती है?" },
  { code: "5b", battery: 5, name: "Octagonal Test", hindi: "अष्टकोण परीक्षण", questions: 96, questionsNote: "", timeMin: 5, timeNote: "", blurb: "An octagon pattern on the left: find the identical one among five.", blurbHi: "बाईं ओर अष्टकोण आकृति: पाँच में से बिल्कुल वैसी ही खोजें।" },
  { code: "5c", battery: 5, name: "Similarity Test Type-II", hindi: "समानता परीक्षण प्रकार-II", questions: 72, questionsNote: "18 × 4", timeMin: 6, timeNote: "", blurb: "An object (a radio) on the left: which of the five on the right matches it?", blurbHi: "बाईं ओर एक वस्तु (रेडियो): दाईं ओर की पाँच में से कौन सी मिलती है?" },
  { code: "5d", battery: 5, name: "Same Circle Test", hindi: "समान वृत्त परीक्षण", questions: 60, questionsNote: "", timeMin: 8, timeNote: "", blurb: "A circle figure on the left: find the exactly similar one among A to E.", blurbHi: "बाईं ओर वृत्त आकृति: A से E में से बिल्कुल समान खोजें।" },
  { code: "5e", battery: 5, name: "Same Figure Test", hindi: "समान आकृति परीक्षण", questions: 72, questionsNote: "", timeMin: 8, timeNote: "", blurb: "Find which of the five figures is identical to the one given.", blurbHi: "दी गई आकृति से बिल्कुल मिलती आकृति पाँच में से खोजें।" },
];

/** The section a paper with no series name belongs to, by its category. */
const DEFAULT_SECTION: Record<string, string> = {
  memory: "1e",
  letter: "2a",
  watch: "2b",
  number: "2c",
  depth: "3b",
  yesno: "4a",
  find6: "4b",
  find9: "4c",
  observation: "4d",
  octagonal: "5b",
  circle: "5d",
  figure: "5e",
};

/** Names compared loosely: case, spaces, hyphens and "Test" at the end do not matter. */
export function sectionKey(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .replace(/test$/u, "");
}

export function sectionByCode(code: string): Section | undefined {
  return SECTIONS.find((s) => s.code === code);
}

/**
 * The section a paper belongs to: by its series name when that names a
 * section, else by its category's usual section when the series name is
 * the category's own title (the name a paper gets when the admin leaves
 * the series blank), else none.
 */
export function sectionOf(series: string, category: string): Section | undefined {
  const key = sectionKey(series);
  const named = SECTIONS.find((s) => sectionKey(s.name) === key);
  if (named) return named;
  const categoryTitle = CATEGORIES.find((c) => c.id === category)?.title ?? "";
  if (!series.trim() || sectionKey(categoryTitle) === key) return sectionByCode(DEFAULT_SECTION[category] ?? "");
  return undefined;
}

export function sectionsOfBattery(battery: number): Section[] {
  return SECTIONS.filter((s) => s.battery === battery);
}

/** "24 Q · 8 min", with the hall's split when it has one: "24 Q (12 + 12) · 8 min (2+2+2+2)". */
export function hallPattern(s: Section): string {
  const q = s.questionsNote ? `${s.questions} Q (${s.questionsNote})` : `${s.questions} Q`;
  const t = s.timeNote ? `${s.timeMin} min (${s.timeNote})` : `${s.timeMin} min`;
  return `${q} · ${t}`;
}

/** The battery a section belongs to, with its names. */
export function batteryOfSection(s: Section) {
  return BATTERIES.find((b) => b.id === s.battery);
}
