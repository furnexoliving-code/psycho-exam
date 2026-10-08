import type { InstructionBlock } from "./types";
import { yesNoQuestions } from "./yesno";
import { findDigitOf, findQuestions } from "./find";

/**
 * The instruction screen a new Perceptual Speed paper starts with: the
 * wording of the real test, with this paper's timing written in. The
 * institute edits it like any other paper's instructions.
 */
export function figureInstructions(testMin: number, instructionMin: number): InstructionBlock[] {
  const min = (n: number, en: boolean) => (en ? `${n} minute${n === 1 ? "" : "s"}` : `${n} मिनट`);
  return [
    {
      en: "This is a test of your ability to match figures quickly and accurately. In each question, a figure is given, below which there are five figures. You are required to find out which of the five figures is identical to the figure given above.",
      hi: "यह आकृतियों को शीघ्रता से सही मिलान करने की योग्यता का परीक्षण है। प्रत्येक प्रश्न में एक आकृति दी गई है, जिसके नीचे पाँच आकृतियाँ हैं। आपको यह बताना है कि नीचे दी गई पाँचों आकृतियों में से कौन-सी आकृति ऊपर दी गई आकृति के समान (एक जैसी) है।",
    },
    {
      en: `The time limit for the test is ${min(testMin, true)}.`,
      hi: `इस परीक्षण हेतु समय सीमा ${min(testMin, false)} है।`,
    },
    {
      en: "Give answer by clicking on the appropriate answer option through the mouse.",
      hi: "अपना उत्तर माउस की सहायता से उपयुक्त विकल्प पर क्लिक करके दें।",
    },
    {
      en: `You have ${min(instructionMin, true)} to read these instructions. When that time is over the test begins by itself. Press Skip Instruction to begin sooner.`,
      hi: `इन निर्देशों को पढ़ने के लिए आपके पास ${min(instructionMin, false)} हैं। यह समय समाप्त होते ही परीक्षण स्वतः प्रारंभ हो जाएगा। जल्दी शुरू करने के लिए Skip Instruction दबाएँ।`,
    },
  ];
}

/**
 * The instruction screen each picture paper starts with, in the wording of
 * the real test as far as it is known, with this paper's timing written
 * in. The institute edits it like any other paper's instructions.
 */
export function pictureInstructions(
  category: string,
  testMin: number,
  instructionMin: number,
  studyMin = 0,
): InstructionBlock[] {
  const min = (n: number, en: boolean) => (en ? `${n} minute${n === 1 ? "" : "s"}` : `${n} मिनट`);
  const timing: InstructionBlock[] = [
    {
      en: `The time limit for the test is ${min(testMin, true)}.`,
      hi: `इस परीक्षण हेतु समय सीमा ${min(testMin, false)} है।`,
    },
    {
      en: "Give answer by clicking on the appropriate answer option through the mouse.",
      hi: "अपना उत्तर माउस की सहायता से उपयुक्त विकल्प पर क्लिक करके दें।",
    },
    {
      en: `You have ${min(instructionMin, true)} to read these instructions. When that time is over the test begins by itself. Press Skip Instruction to begin sooner.`,
      hi: `इन निर्देशों को पढ़ने के लिए आपके पास ${min(instructionMin, false)} हैं। यह समय समाप्त होते ही परीक्षण स्वतः प्रारंभ हो जाएगा। जल्दी शुरू करने के लिए Skip Instruction दबाएँ।`,
    },
  ];
  switch (category) {
    case "memory":
      return [
        {
          en: `This is a test of memory. The test is in parts. In each part there is a Study screen and a Test screen. On the Study screen, sets of some shapes are given for ${min(studyMin || 1, true)}. Your task is to memorise these sets of shapes. After the allotted time the Test screen will appear. On the Test screen, for each problem you will find five options A, B, C, D and E. One of the options shows a set of shapes exactly similar to one you have seen on the Study screen.`,
          hi: `यह स्मृति का परीक्षण है। यह परीक्षण भागों में है। प्रत्येक भाग में एक अध्ययन स्क्रीन और एक परीक्षण स्क्रीन है। अध्ययन स्क्रीन पर कुछ आकृतियों के सेट ${min(studyMin || 1, false)} के लिए दिए गए हैं। आपको आकृतियों के इन सेटों को याद करना है। नियत समय के बाद परीक्षण स्क्रीन दिखेगी। परीक्षण स्क्रीन पर प्रत्येक प्रश्न में आपको पाँच विकल्प A, B, C, D और E मिलेंगे। इनमें से एक विकल्प में आकृतियों का सेट बिल्कुल वैसा होगा जैसा आपने अध्ययन स्क्रीन पर देखा है।`,
        },
        ...timing,
      ];
    case "brick":
      return [
        {
          en: "In this test you will see a pile of bricks with some bricks labelled A, B, C, D and E. Your task is to count the number of bricks that are touching the brick of the pile that has any one of the letters on it. All bricks are of the same size and shape.",
          hi: "आप इस परीक्षण में ईंटों का एक समूह देखेंगे जिसमें कुछ ईंटों पर A, B, C, D एवं E लिखा होगा। आपको उन ईंटों की गणना करनी है जो समूह में उन ईंटों को छू रही हैं जिन पर इनमें से कोई एक अक्षर दिया गया है। सभी ईंटें समान आकार एवं माप की हैं।",
        },
        ...timing,
      ];
    case "depth":
      return [
        {
          en: "In each item of this test, you will see a pile of blocks. Each block is of the same shape and size. Your task is to count the number of blocks having all sides and corners hidden by the other blocks. Please remember that there are always three blocks in the base of the farthest row.",
          hi: "आप इस परीक्षण के प्रत्येक प्रश्न में ब्लाक्स (गुटकों) का एक ढेर देखेंगे। सारे ब्लाक्स एक ही आकार और माप के हैं। ढेर में आपको उन ब्लाक्स की गिनती करनी है जिनकी सभी सतहें और किनारे पूर्ण रूप से अन्य ब्लाक्स से छिपे हुए हैं। कृपया याद रखें कि सबसे पीछे की पंक्ति के आधार में सदैव तीन ब्लाक्स (गुटके) ही होंगे।",
        },
        ...timing,
      ];
    case "yesno":
      return [
        {
          en: "This is a test to find out how quickly you can compare two numbers and decide whether or not they are the same. In each question two numbers are given side by side. If the numbers are the same, select 'Y'; otherwise select 'N' by clicking the mouse.",
          hi: "इस परीक्षण में आपको दिये गये दो अंक समूहों के बीच शीघ्रता से तुलना करनी है और यह तय करना है कि वे एक जैसे हैं या भिन्न। प्रत्येक प्रश्न में दो संख्याएँ आमने-सामने दी गई हैं। यदि अंक समान हैं तो माउस की सहायता से 'Y' चुनें, अन्यथा 'N' चुनें।",
        },
        ...timing,
      ];
    case "find6":
    case "find9": {
      const d = findDigitOf(category) ?? "6";
      return [
        {
          en: `In this test you will find four groups (A, B, C and D) of digits. Your task is to find out the group of digits which contains a '${d}' and indicate your answer by clicking the mouse. In case the digit '${d}' appears in more than one group, your answer will be 'E'.`,
          hi: `इस परीक्षण के प्रत्येक प्रश्न में अंकों के चार समूह (A, B, C और D) दिये गये हैं। आपको यह पता करना है कि किस अंक समूह में '${d}' का अंक आया है तथा माउस से क्लिक करके उत्तर देना है। यदि किसी प्रश्न में एक से अधिक अंक समूहों में '${d}' आता है तो आपका उत्तर 'E' होगा।`,
        },
        ...timing,
      ];
    }
    case "observation":
      return [
        {
          en: "This test measures your ability to quickly observe and compare figures given in two sets. In this test you will be shown two sets 'A' and 'B' of figures in a sequence to observe. Your task is to find out whether the placement of each figure in set A is exactly similar to the placement of figures in set B or there is some difference. If the placement of each figure in both the sets is exactly similar then your answer will be 'A'; if there are two differences in the placement of each figure you have to give answer 'B'; if there are three differences then your answer will be 'C'; and if there are four differences then your answer will be 'D'. In this test there will be either no difference or a minimum of 2 and maximum of 4 differences in the placement of each figure.",
          hi: "यह परीक्षण शीघ्रता के साथ दो सेटों में दिये गये चित्रों की तुलना करने की आपकी योग्यता का माप करता है। इस परीक्षण में कुछ चित्र क्रम से सेट 'A' तथा सेट 'B' के माध्यम से दिखाए जाएंगे। आपको यह बताना है कि सेट 'A' में दिये गये चित्रों का स्थान सेट 'B' में दिए गए चित्रों के स्थान क्रम के बिल्कुल समान है अथवा कुछ भिन्न है। यदि दोनों सेटों के स्थान क्रम में पूर्ण समानता है तो उत्तर 'A' होगा; यदि दो चित्रों के स्थान क्रम में अंतर है तो उत्तर 'B' होगा; यदि तीन चित्रों के स्थान क्रम में अंतर है तो उत्तर 'C' होगा; इसी प्रकार यदि चार चित्रों के स्थान क्रम में अंतर है तो उत्तर 'D' होगा। इस परीक्षण में चित्रों के स्थान क्रम में या तो कोई अंतर नहीं होगा या स्थान क्रम में कम से कम दो और अधिकतम चार अंतर होगा।",
        },
        ...timing,
      ];
    case "similarity":
      return [
        {
          en: "This is a test of how rapidly you can see figures in order to match them. On each sheet four figures, a, b, c and d, are given at the left. For each one, look at the five figures A, B, C, D and E at its right and find the one that is most nearly like it. Give your answer by clicking the mouse.",
          hi: "यह आकृतियों के दो सेटों का शीघ्रता से मिलान करने की योग्यता का परीक्षण है। प्रत्येक पृष्ठ पर बाईं ओर चार आकृतियाँ a, b, c और d दी गई हैं। हर एक के लिए दाईं ओर बनी पाँच आकृतियों A, B, C, D और E में से वह आकृति खोजें जो उससे सबसे अधिक मिलती है। अपना उत्तर माउस क्लिक करके दें।",
        },
        ...timing,
      ];
    case "similarity2":
      return [
        {
          en: "This is a test of how rapidly you can see objects in order to match them. On each sheet four objects, a, b, c and d, are given at the left. For each one, look at the five objects A, B, C, D and E at its right and find the one that is most nearly like it. Give your answer by clicking the mouse.",
          hi: "यह वस्तुओं के दो सेटों का शीघ्रता से मिलान करने की योग्यता का परीक्षण है। प्रत्येक पृष्ठ पर बाईं ओर चार वस्तुएँ a, b, c और d दी गई हैं। हर एक के लिए दाईं ओर बनी पाँच वस्तुओं A, B, C, D और E में से वह खोजें जो उससे सबसे अधिक मिलती है। अपना उत्तर माउस क्लिक करके दें।",
        },
        ...timing,
      ];
    case "octagonal":
      return [
        {
          en: "This is a test of your ability to match figures quickly. A figure is given on the left side. On the right side there are five other figures. You are required to find out which of the five figures is identical to the figure given on the left.",
          hi: "यह आकृतियों के शीघ्रतापूर्वक मिलान करने की योग्यता का परीक्षण है। बाईं तरफ एक आकृति दी गयी है; दाहिनी तरफ पाँच अन्य आकृतियाँ दी गयी हैं। आपको यह पता करना है कि पाँचों आकृतियों में से कौन सी आकृति बाईं ओर दी गयी आकृति के समान है।",
        },
        ...timing,
      ];
    case "circle":
      return [
        {
          en: "This is a test of your ability to match figures quickly and accurately. In each problem a figure is given at the left followed by figures A, B, C, D and E on the right hand side. You are to find out which of these five figures is exactly similar to the figure given on the left. Indicate your answers by clicking the mouse.",
          hi: "यह आकृतियों के शीघ्रतापूर्वक सही मिलान करने की योग्यता का परीक्षण है। प्रत्येक समस्या में बाईं ओर एक आकृति मिलेगी जिसके दाईं ओर A, B, C, D एवं E आकृतियाँ दी हुई हैं। आपको ज्ञात करना है कि इन पाँच आकृतियों में से कौन सी आकृति बाईं ओर दी आकृति से पूर्णतया मिलती है। आपको माउस से क्लिक करके उत्तर देना होगा।",
        },
        ...timing,
      ];
    default:
      return figureInstructions(testMin, instructionMin);
  }
}

/** The worked-example paragraphs of the Octagonal and Same Circle Tests; the institute adds its example pictures under them. */
export const OCTAGONAL_EXAMPLE_TEXT: InstructionBlock[] = [
  {
    en: "For the first example the correct answer is 'D'. Similarly the correct answers for examples 2 and 3 are 'A' and 'D' respectively.",
    hi: "पहले उदाहरण के लिए सही उत्तर 'D' है। इसी प्रकार अभ्यास 2 एवं 3 का सही उत्तर क्रमशः 'A' एवं 'D' है।",
  },
];
export const CIRCLE_EXAMPLE_TEXT: InstructionBlock[] = [
  {
    en: "The correct answer for practice problem 1 is 'C', and for 2 it is 'B'.",
    hi: "अभ्यास समस्या 1 का सही उत्तर 'C', 2 का 'B' है।",
  },
];

/** The example paragraphs a picture-matching test starts with. */
export function matchingExampleText(category: string): InstructionBlock[] {
  return category === "octagonal" ? OCTAGONAL_EXAMPLE_TEXT : category === "circle" ? CIRCLE_EXAMPLE_TEXT : FIGURE_EXAMPLE_TEXT;
}

/** The worked-example paragraphs; the institute adds its example pictures under them. */
export const FIGURE_EXAMPLE_TEXT: InstructionBlock[] = [
  {
    en: "For the first example the correct answer is 'A'. Similarly the correct answers for examples 2 and 3 are 'B' and 'D' respectively.",
    hi: "पहले उदाहरण के लिए सही उत्तर 'A' है। इसी प्रकार अभ्यास 2 एवं 3 का सही उत्तर क्रमशः 'B' एवं 'D' है।",
  },
];

/** The letters the options are named by, in order. */
export const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

/** How many figures a question offers; the real test shows five. */
export const DEFAULT_OPTION_COUNT = 5;
export const MAX_OPTION_COUNT = OPTION_LETTERS.length;
/** Numbered options run 1, 2, 3 …; the Depth Perception test offers ten. */
export const MAX_NUMBER_OPTIONS = 12;

export type OptionStyle = "letters" | "numbers";

/** The option values a question offers, in order: A, B, C … or 1, 2, 3 … */
export function optionValues(style: OptionStyle, count: number): (string | number)[] {
  if (style === "numbers") return Array.from({ length: count }, (_, i) => i + 1);
  return [...OPTION_LETTERS.slice(0, count)];
}

/** How large a picture test draws its pictures when the paper does not say: percent of the usual size. */
export function defaultPictureScale(category: string | undefined): number {
  return category === "depth" || category === "brick" || category === "similarity" || category === "similarity2" ? 225 : category === "memory" ? 140 : 100;
}

/** The sizes offered in the settings. */
export const PICTURE_SCALES = [75, 100, 125, 140, 150, 200, 225, 250] as const;

/** What each picture test offers by default; the admin may change it per upload. */
export function defaultOptionsFor(category: string): { style: OptionStyle; count: number } {
  switch (category) {
    case "depth":
    case "brick":
      return { style: "numbers", count: 10 };
    case "similarity":
    case "similarity2":
      return { style: "letters", count: 5 };
    case "observation":
      return { style: "letters", count: 4 };
    default:
      return { style: "letters", count: DEFAULT_OPTION_COUNT };
  }
}
/** The worked example the Yes or No Test's instruction screen shows: the guideline's own five pairs. */
export const YESNO_EXAMPLE_TEXT: InstructionBlock[] = [
  { en: "1.   589 = 589", hi: "1.   589 = 589" },
  { en: "2.   2768 = 2786", hi: "2.   2768 = 2786" },
  { en: "3.   36463 = 36462", hi: "3.   36463 = 36462" },
  { en: "4.   712963 = 712963", hi: "4.   712963 = 712963" },
  { en: "5.   487562 = 487652", hi: "5.   487562 = 487652" },
  {
    en: "The answers for the above questions are 'Y', 'N', 'N', 'Y' and 'N'.",
    hi: "ऊपर दिये गये प्रश्नों के सही उत्तर क्रमशः 'Y', 'N', 'N', 'Y' और 'N' हैं।",
  },
];

/** The worked examples the Find tests' instruction screens show: the guideline's own rows. */
export const FIND6_EXAMPLE_TEXT: InstructionBlock[] = [
  { en: "1.  A 72383514  B 98734521  C 12947685  D 39587421", hi: "1.  A 72383514  B 98734521  C 12947685  D 39587421" },
  { en: "2.  A 1354931582  B 2943587138  C 7823945125  D 4793268251", hi: "2.  A 1354931582  B 2943587138  C 7823945125  D 4793268251" },
  { en: "3.  A 7938210435  B 5938204751  C 8475210239  D 3897104652", hi: "3.  A 7938210435  B 5938204751  C 8475210239  D 3897104652" },
  { en: "4.  A 250389417  B 984057213  C 358164072  D 280157943", hi: "4.  A 250389417  B 984057213  C 358164072  D 280157943" },
  { en: "5.  A 47854323179  B 98423563172  C 31792428534  D 21374894579", hi: "5.  A 47854323179  B 98423563172  C 31792428534  D 21374894579" },
  { en: "The answers for the above questions are C, D, D, C and B.", hi: "ऊपर दिये गये प्रश्नों के सही उत्तर क्रमशः C, D, D, C और B हैं।" },
];
export const FIND9_EXAMPLE_TEXT: InstructionBlock[] = [
  { en: "1.  A 5462  B 5927  C 4282  D 2821", hi: "1.  A 5462  B 5927  C 4282  D 2821" },
  { en: "2.  A 73457  B 24674  C 32985  D 54838", hi: "2.  A 73457  B 24674  C 32985  D 54838" },
  { en: "3.  A 482942  B 2541248  C 2532184  D 5421482", hi: "3.  A 482942  B 2541248  C 2532184  D 5421482" },
  { en: "4.  A 2834  B 4382  C 8341  D 2932", hi: "4.  A 2834  B 4382  C 8341  D 2932" },
  { en: "5.  A 89537  B 38567  C 58974  D 28378", hi: "5.  A 89537  B 38567  C 58974  D 28378" },
  { en: "The answers for the above questions are B, C, A, D and E.", hi: "ऊपर दिये गये प्रश्नों के सही उत्तर क्रमशः B, C, A, D और E हैं।" },
];

/** The worked example the Brick Test's instruction screen gives: the institute adds the example pile's picture above it. */
export const BRICK_EXAMPLE_TEXT: InstructionBlock[] = [
  {
    en: "For example, in the pile above the brick with an 'A' on it touches two other bricks, viz., 'D' and 'E', hence the answer will be 2. Similarly bricks B, C and D and E touch 3, 3, 4 and 4 bricks respectively.",
    hi: "उदाहरण के लिए उपरोक्त समूह में 'A' वाली ईंट दो अन्य ईंटों 'D' और 'E' को छू रही है अतः उत्तर 2 होगा। इसी प्रकार B, C, D एवं E अक्षर वाली ईंटें क्रमशः 3, 3, 4 और 4 ईंटों को छू रही हैं।",
  },
];

/** The worked examples the Similarity Tests' instruction screens give: the institute adds the example sheet's picture above them. */
export const SIMILARITY_EXAMPLE_TEXT: InstructionBlock[] = [
  {
    en: "Look at the first figure 'a' at the left. Which one of the five at the right is most nearly like it? Figure D is the one, so the answer for 'a' is D. For the second figure 'b' the answer is C. For 'c' it is B, and for 'd' it is A.",
    hi: "बाईं ओर बनी पहली आकृति 'a' को देखें। दाईं ओर की पाँच आकृतियों में से कौन सी उससे सबसे अधिक मिलती है? आकृति D मिलती है, अतः 'a' का उत्तर D है। दूसरी आकृति 'b' का उत्तर C है। 'c' का उत्तर B और 'd' का उत्तर A है।",
  },
];
export const SIMILARITY2_EXAMPLE_TEXT: InstructionBlock[] = [
  {
    en: "Look at the first radio 'a' at the left. Which one of the five at the right is most nearly like it? Radio B is the one. For the second radio 'b' the answer is C. For 'c' it is A, and for 'd' it is D.",
    hi: "बाईं ओर बने पहले रेडियो 'a' को देखें। दाईं ओर के पाँच रेडियो में से कौन सा उससे सबसे अधिक मिलता है? रेडियो B मिलता है। दूसरे रेडियो 'b' का उत्तर C है। 'c' का उत्तर A और 'd' का उत्तर D है।",
  },
];

/** The example paragraphs a sheet test starts with. */
export function sheetExampleText(category: string): InstructionBlock[] {
  return category === "similarity" ? SIMILARITY_EXAMPLE_TEXT : category === "similarity2" ? SIMILARITY2_EXAMPLE_TEXT : BRICK_EXAMPLE_TEXT;
}

/** The lettered bricks of one pile: the five questions each pile asks, in order. */
export const BRICK_LETTERS = ["A", "B", "C", "D", "E"] as const;

/**
 * The sheet tests: one picture carries several questions. The Brick Test
 * (a pile, five lettered bricks A to E, answered by a number) and the two
 * Similarity Tests (a sheet of four figures a to d, each matched against
 * five, answered by a letter). The picture stands at the left of the
 * screen and its questions at the right.
 */
export interface SheetSpec {
  /** What one picture is called in the admin panel. */
  noun: string;
  /** The questions each picture asks, in order, as they are labelled on it. */
  prompts: readonly string[];
  /** What the result's topic breakdown calls a question: "Brick A", "Figure a". */
  topicPrefix: string;
  style: OptionStyle;
  count: number;
  /** How many pictures the hall gives, and its clock. */
  pictures: number;
  timeMin: number;
}

const SHEETS: Record<string, SheetSpec> = {
  brick: { noun: "pile", prompts: BRICK_LETTERS, topicPrefix: "Brick", style: "numbers", count: 10, pictures: 10, timeMin: 5 },
  similarity: { noun: "sheet", prompts: ["a", "b", "c", "d"], topicPrefix: "Figure", style: "letters", count: 5, pictures: 18, timeMin: 6 },
  similarity2: { noun: "sheet", prompts: ["a", "b", "c", "d"], topicPrefix: "Figure", style: "letters", count: 5, pictures: 18, timeMin: 6 },
};

/** The sheet spec of a category, or null for a test whose pictures are one question each. */
export function sheetOf(category: string | null | undefined): SheetSpec | null {
  return category ? (SHEETS[category] ?? null) : null;
}

/** The most pictures the panel sends the server in one call. */
export const FIGURE_BATCH = 50;

/**
 * A tiny Perceptual Speed paper that ships with the portal, so the screen
 * can be seen before a database is connected. Its pictures are drawn
 * inline, so it needs no storage bucket. Like the bundled watch table, it
 * is not a paper any student can reach once a database is in place.
 */
function figureSvg(marks: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect x="10" y="10" width="100" height="100" rx="14" fill="#fff" stroke="#333" stroke-width="3"/>${marks}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
const STAR = '<path d="M60 28 l9 20 22 2 -17 14 5 22 -19 -12 -19 12 5 -22 -17 -14 22 -2z" fill="none" stroke="#333" stroke-width="3"/>';
const DOT = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="7" fill="#333"/>`;
const CROSS = (x: number, y: number) => `<path d="M${x - 8} ${y - 8} l16 16 M${x + 8} ${y - 8} l-16 16" stroke="#333" stroke-width="3"/>`;

const SHAPES = [
  STAR + DOT(30, 30) + CROSS(90, 90),
  STAR + DOT(90, 30) + CROSS(30, 90),
  STAR + DOT(30, 90) + CROSS(90, 30),
  STAR + DOT(90, 90) + CROSS(30, 30),
  STAR + DOT(60, 95) + CROSS(60, 25),
];

export const FIGURE_SAMPLE_ID = "perceptual-speed-sample";

export function figureSamplePaper() {
  const letters = OPTION_LETTERS.slice(0, 5);
  const questions = [0, 2, 4, 1].map((answerIndex, i) => {
    // Each question's options are the five figures in a different order,
    // and the answer is wherever the target figure landed.
    const order = SHAPES.map((_, k) => (k + i) % SHAPES.length);
    const target = SHAPES[answerIndex];
    return {
      id: `fs-q${i + 1}`,
      tableIndex: 0,
      prompt: { en: "", hi: "" },
      options: [...letters],
      answer: letters[order.indexOf(answerIndex)],
      working: { en: "", hi: "" },
      topic: "Same figure",
      image: figureSvg(target),
      optionImages: order.map((k) => figureSvg(SHAPES[k])),
    };
  });
  return {
    id: FIGURE_SAMPLE_ID,
    kind: "figure" as const,
    category: "figure",
    title: "Perceptual Speed Test",
    displayName: "Perceptual Speed Test - Sample",
    features: { showQuestionPaperButton: false, lockScroll: false, overflowQuestions: false, questionsPerPart: 2 },
    timeLimitMin: 1,
    instructionTimeLimitMin: 5,
    instructions: figureInstructions(1, 5),
    example: { table: { label: "Example", cells: [] }, text: FIGURE_EXAMPLE_TEXT },
    tables: [{ label: "No. 1", cells: [] }],
    questions,
    resultView: {},
  };
}

/** A tiny Memory Test, shipped like the Perceptual Speed sample: study screens on a short clock. */
export const MEMORY_SAMPLE_ID = "memory-sample";

export function memorySamplePaper() {
  const letters = OPTION_LETTERS.slice(0, 5);
  const study = [
    figureSvg(SHAPES[0]),
    figureSvg(SHAPES[3]),
  ];
  const questions = [0, 2, 3, 4].map((answerIndex, i) => {
    const order = SHAPES.map((_, k) => (k + i) % SHAPES.length);
    return {
      id: `ms-q${i + 1}`,
      tableIndex: 0,
      prompt: { en: "", hi: "" },
      options: [...letters],
      answer: letters[order.indexOf(answerIndex)],
      working: { en: "", hi: "" },
      topic: "Memory",
      optionImages: order.map((k) => figureSvg(SHAPES[k])),
    };
  });
  return {
    id: MEMORY_SAMPLE_ID,
    kind: "figure" as const,
    category: "memory",
    title: "Memory Test",
    displayName: "Memory Test - Sample",
    features: {
      showQuestionPaperButton: false,
      lockScroll: true,
      overflowQuestions: false,
      questionsPerPart: 2,
      // Seconds, not minutes, so the sample can be watched through: 3 s to
      // study, 3 s of questions, per part.
      studyTimeMin: 0.05,
      partTimeMin: 0.05,
      breakTimeMin: 0.05,
      studyImages: study,
    },
    timeLimitMin: 1,
    instructionTimeLimitMin: 5,
    instructions: pictureInstructions("memory", 1, 5, 1),
    example: { table: { label: "Example", cells: [] }, text: [] },
    tables: [{ label: "No. 1", cells: [] }],
    questions,
    resultView: {},
  };
}

/** A tiny Power of Observation paper, for seeing the Set A / Set B layout before a database exists. */
export const OBSERVATION_SAMPLE_ID = "observation-sample";

export function observationSamplePaper() {
  const glyphs = ["★", "●", "■", "▲", "◆", "✚"];
  const row = (order: number[], swap: [number, number] | null) => {
    const b = [...order];
    if (swap) [b[swap[0]], b[swap[1]]] = [b[swap[1]], b[swap[0]]];
    const text = (arr: number[], x0: number) =>
      arr.map((g, i) => `<text x="${x0 + i * 40}" y="42" font-size="30" text-anchor="middle" fill="#111">${glyphs[g]}</text>`).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="60" viewBox="0 0 560 60">${text(order, 30)}<line x1="265" y1="6" x2="265" y2="54" stroke="#111" stroke-width="2"/>${text(b, 300)}</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };
  const letters = OPTION_LETTERS.slice(0, 4);
  const items: [number[], [number, number] | null, string][] = [
    [[0, 1, 2, 3, 4, 5], null, "A"],
    [[5, 4, 3, 2, 1, 0], [0, 5], "B"],
    [[2, 0, 4, 1, 5, 3], [1, 2], "B"],
    [[1, 3, 5, 0, 2, 4], null, "A"],
  ];
  return {
    id: OBSERVATION_SAMPLE_ID,
    kind: "figure" as const,
    category: "observation",
    title: "Power of Observation Test",
    displayName: "Power of Observation Test - Sample",
    features: { showQuestionPaperButton: false, lockScroll: true, overflowQuestions: false, questionsPerPart: 2 },
    timeLimitMin: 1,
    instructionTimeLimitMin: 5,
    instructions: pictureInstructions("observation", 1, 5),
    example: { table: { label: "Example", cells: [] }, text: [] },
    tables: [{ label: "No. 1", cells: [] }],
    questions: items.map(([order, swap, answer], i) => ({
      id: `os-q${i + 1}`,
      tableIndex: 0,
      prompt: { en: "", hi: "" },
      options: [...letters],
      answer,
      working: { en: "", hi: "" },
      topic: "Observation",
      image: row(order, swap),
    })),
    resultView: {},
  };
}

/** A tiny Depth Perception paper: a scene per question, drawn half as large again, answered by a letter. */
export const DEPTH_SAMPLE_ID = "depth-sample";

export function depthSamplePaper() {
  // Four blocks at different "depths": the nearest is the largest and lowest.
  const scene = (sizes: number[]) => {
    const rects = sizes
      .map((sz, i) => `<rect x="${30 + i * 70}" y="${70 - sz}" width="${sz}" height="${sz}" fill="#fff" stroke="#111" stroke-width="2"/><text x="${30 + i * 70 + sz / 2}" y="${70 - sz - 6}" font-size="14" text-anchor="middle" fill="#111">${OPTION_LETTERS[i]}</text>`)
      .join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" viewBox="0 0 320 80"><line x1="10" y1="72" x2="310" y2="72" stroke="#999"/>${rects}</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };
  const letters = OPTION_LETTERS.slice(0, 4);
  const items: [number[], string][] = [
    [[50, 30, 40, 20], "A"],
    [[20, 50, 30, 40], "B"],
    [[30, 20, 50, 40], "C"],
    [[40, 30, 20, 50], "D"],
  ];
  return {
    id: DEPTH_SAMPLE_ID,
    kind: "figure" as const,
    category: "depth",
    title: "Depth Perception Test",
    displayName: "Depth Perception Test - Sample",
    features: { showQuestionPaperButton: false, lockScroll: true, overflowQuestions: false, questionsPerPart: 2 },
    timeLimitMin: 1,
    instructionTimeLimitMin: 5,
    instructions: pictureInstructions("depth", 1, 5),
    example: { table: { label: "Example", cells: [] }, text: [] },
    tables: [{ label: "No. 1", cells: [] }],
    questions: items.map(([sizes, answer], i) => ({
      id: `ds-q${i + 1}`,
      tableIndex: 0,
      prompt: { en: "", hi: "" },
      options: [...letters],
      answer,
      working: { en: "", hi: "" },
      topic: "Depth",
      image: scene(sizes),
    })),
    resultView: {},
  };
}

/** A Yes or No paper at the hall's size, built from a fixed seed, for seeing the screen before a database exists. */
export const YESNO_SAMPLE_ID = "yes-or-no-sample";

export function yesNoSamplePaper() {
  return {
    id: YESNO_SAMPLE_ID,
    kind: "figure" as const,
    category: "yesno",
    title: "Yes or No Test",
    displayName: "Yes or No Test - Sample",
    features: { showQuestionPaperButton: false, lockScroll: true, overflowQuestions: false, questionsPerPart: 24 },
    timeLimitMin: 4,
    instructionTimeLimitMin: 5,
    instructions: pictureInstructions("yesno", 4, 5),
    example: { table: { label: "Example", cells: [] }, text: YESNO_EXAMPLE_TEXT },
    tables: [{ label: "No. 1", cells: [] }],
    questions: yesNoQuestions({ seed: 20200101, count: 96 }, "yn"),
    resultView: {},
  };
}

/** Find 6 and Find 9 papers at the hall's size, built from a fixed seed, for seeing the screen before a database exists. */
export const FIND6_SAMPLE_ID = "find-6-sample";
export const FIND9_SAMPLE_ID = "find-9-sample";

export function findSamplePaper(category: "find6" | "find9") {
  const digit = findDigitOf(category) ?? "6";
  return {
    id: category === "find6" ? FIND6_SAMPLE_ID : FIND9_SAMPLE_ID,
    kind: "figure" as const,
    category,
    title: `Find ${digit} Test`,
    displayName: `Find ${digit} Test - Sample`,
    features: { showQuestionPaperButton: false, lockScroll: true, overflowQuestions: false, questionsPerPart: 25 },
    timeLimitMin: 4,
    instructionTimeLimitMin: 5,
    instructions: pictureInstructions(category, 4, 5),
    example: { table: { label: "Example", cells: [] }, text: category === "find6" ? FIND6_EXAMPLE_TEXT : FIND9_EXAMPLE_TEXT },
    tables: [{ label: "No. 1", cells: [] }],
    questions: findQuestions(digit, { seed: 20200101, count: 75 }, category),
    resultView: {},
  };
}

/** The Octagonal and Same Circle Tests ride the Same Figure engine; a sample of each shows its instruction screen before a database exists. */
export const OCTAGONAL_SAMPLE_ID = "octagonal-sample";
export const CIRCLE_SAMPLE_ID = "same-circle-sample";

export function matchingSamplePaper(category: "octagonal" | "circle") {
  const base = figureSamplePaper();
  const octagonal = category === "octagonal";
  return {
    ...base,
    id: octagonal ? OCTAGONAL_SAMPLE_ID : CIRCLE_SAMPLE_ID,
    category,
    title: octagonal ? "Octagonal Test" : "Same Circle Test",
    displayName: octagonal ? "Octagonal Test - Sample" : "Same Circle Test - Sample",
    instructions: pictureInstructions(category, 1, 5),
    example: { table: { label: "Example", cells: [] }, text: matchingExampleText(category) },
    questions: base.questions.map((q) => ({ ...q, id: `${category}-${q.id}` })),
  };
}

/** A Brick Test of two piles, drawn in the portal, for seeing the two-column screen before a database exists. */
export const BRICK_SAMPLE_ID = "brick-sample";

export function brickSamplePaper() {
  // A pile drawn flat: rows of bricks, five of them lettered.
  const pile = (letters: [number, number][]) => {
    const w = 60, h = 28;
    const rows = [[0, 1, 2], [0.5, 1.5], [0, 1, 2]];
    let rects = "";
    rows.forEach((row, r) => {
      row.forEach((c) => {
        const x = 20 + c * w, y = 20 + (rows.length - 1 - r) * h;
        const tag = letters.find(([lr, lc]) => lr === r && lc === c);
        rects += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" stroke="#111" stroke-width="2"/>`;
        if (tag) rects += `<text x="${x + w / 2}" y="${y + h / 2 + 6}" font-size="16" text-anchor="middle" fill="#111">${BRICK_LETTERS[letters.indexOf(tag)]}</text>`;
      });
    });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="120" viewBox="0 0 220 120">${rects}</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };
  const piles: { image: string; answers: number[] }[] = [
    { image: pile([[0, 0], [0, 2], [1, 0.5], [2, 1], [2, 2]]), answers: [2, 2, 4, 3, 2] },
    { image: pile([[0, 1], [1, 1.5], [2, 0], [2, 1], [0, 2]]), answers: [4, 4, 2, 3, 2] },
  ];
  const questions = piles.flatMap((p, pi) =>
    BRICK_LETTERS.map((letter, li) => ({
      id: `br-q${pi * 5 + li + 1}`,
      tableIndex: 0,
      prompt: { en: letter, hi: "" },
      options: optionValues("numbers", 10),
      answer: p.answers[li],
      working: { en: "", hi: "" },
      topic: `Brick ${letter}`,
      image: p.image,
    })),
  );
  return {
    id: BRICK_SAMPLE_ID,
    kind: "figure" as const,
    category: "brick",
    title: "Brick Test",
    displayName: "Brick Test - Sample",
    features: { showQuestionPaperButton: false, lockScroll: true, overflowQuestions: false, questionsPerPart: 5 },
    timeLimitMin: 1,
    instructionTimeLimitMin: 5,
    instructions: pictureInstructions("brick", 1, 5),
    example: { table: { label: "Example", cells: [] }, text: BRICK_EXAMPLE_TEXT },
    tables: [{ label: "No. 1", cells: [] }],
    questions,
    resultView: {},
  };
}

/** A Similarity Test of two sheets, drawn in the portal, for seeing the two-column screen before a database exists. */
export const SIMILARITY_SAMPLE_ID = "similarity-sample";
export const SIMILARITY2_SAMPLE_ID = "similarity-2-sample";

export function similaritySamplePaper(category: "similarity" | "similarity2") {
  // A sheet: four rows, each a figure at the left and five at the right,
  // lettered A to E; the figures are the Same Figure sample's stars.
  const rowSvg = (y: number, label: string, target: number, order: number[]) => {
    const cell = (x: number, k: number) => `<g transform="translate(${x} ${y}) scale(0.42)">${SHAPES[k]}</g>`;
    const letters = order.map((_, i) => `<text x="${150 + i * 64 + 25}" y="${y + 62}" font-size="12" text-anchor="middle" fill="#111">${OPTION_LETTERS[i]}</text>`).join("");
    return `<text x="20" y="${y + 32}" font-size="16" fill="#111">${label}</text>${cell(40, target)}${order.map((k, i) => cell(150 + i * 64, k)).join("")}${letters}`;
  };
  const sheet = (rows: { target: number; order: number[] }[]) => {
    const body = rows.map((r, i) => rowSvg(10 + i * 72, ["a", "b", "c", "d"][i], r.target, r.order)).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300"><rect x="1" y="1" width="478" height="298" fill="#fff" stroke="#999"/>${body}</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };
  const sheets = [
    { rows: [{ target: 0, order: [3, 1, 0, 2, 4] }, { target: 2, order: [2, 4, 1, 0, 3] }, { target: 4, order: [1, 0, 3, 4, 2] }, { target: 1, order: [1, 2, 4, 3, 0] }] },
    { rows: [{ target: 3, order: [0, 3, 2, 1, 4] }, { target: 1, order: [4, 2, 0, 1, 3] }, { target: 0, order: [2, 1, 4, 3, 0] }, { target: 2, order: [3, 0, 1, 2, 4] }] },
  ];
  const spec = sheetOf(category)!;
  const questions = sheets.flatMap((sh, si) =>
    sh.rows.map((r, ri) => ({
      id: `${category}-q${si * 4 + ri + 1}`,
      tableIndex: 0,
      prompt: { en: spec.prompts[ri], hi: "" },
      options: optionValues("letters", 5),
      answer: OPTION_LETTERS[r.order.indexOf(r.target)],
      working: { en: "", hi: "" },
      topic: `${spec.topicPrefix} ${spec.prompts[ri]}`,
      image: sheet(sh.rows),
    })),
  );
  const two = category === "similarity2";
  return {
    id: two ? SIMILARITY2_SAMPLE_ID : SIMILARITY_SAMPLE_ID,
    kind: "figure" as const,
    category,
    title: two ? "Similarity Test Type-II" : "Similarity Test",
    displayName: two ? "Similarity Test Type-II - Sample" : "Similarity Test - Sample",
    features: { showQuestionPaperButton: false, lockScroll: true, overflowQuestions: false, questionsPerPart: 4 },
    timeLimitMin: 1,
    instructionTimeLimitMin: 5,
    instructions: pictureInstructions(category, 1, 5),
    example: { table: { label: "Example", cells: [] }, text: sheetExampleText(category) },
    tables: [{ label: "No. 1", cells: [] }],
    questions,
    resultView: {},
  };
}
