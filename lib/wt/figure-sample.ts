import type { InstructionBlock } from "./types";

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
    case "depth":
      return [
        {
          en: "In each item of this test, you will see a pile of blocks. Each block is of the same shape and size. Your task is to count the number of blocks having all sides and corners hidden by the other blocks. Please remember that there are always three blocks in the base of the farthest row.",
          hi: "आप इस परीक्षण के प्रत्येक प्रश्न में ब्लाक्स (गुटकों) का एक ढेर देखेंगे। सारे ब्लाक्स एक ही आकार और माप के हैं। ढेर में आपको उन ब्लाक्स की गिनती करनी है जिनकी सभी सतहें और किनारे पूर्ण रूप से अन्य ब्लाक्स से छिपे हुए हैं। कृपया याद रखें कि सबसे पीछे की पंक्ति के आधार में सदैव तीन ब्लाक्स (गुटके) ही होंगे।",
        },
        ...timing,
      ];
    case "observation":
      return [
        {
          en: "This test measures your ability to quickly observe and compare figures given in two sets. In this test you will be shown two sets 'A' and 'B' of figures in a sequence to observe. Your task is to find out whether the placement of each figure in set A is exactly similar to the placement of figures in set B or there is some difference. If the placement of each figure in both the sets is exactly similar then your answer will be 'A'; if there are two differences in the placement of each figure you have to give answer 'B'; if there are three differences then your answer will be 'C'; and if there are four differences then your answer will be 'D'. In this test there will be either no difference or a minimum of 2 and maximum of 4 differences in the placement of each figure.",
          hi: "यह परीक्षण शीघ्रता के साथ दो सेटों में दिये गये चित्रों की तुलना करने की आपकी योग्यता का माप करता है। इस परीक्षण में कुछ चित्र क्रम से सेट 'A' तथा सेट 'B' के माध्यम से दिखाए जाएंगे। आपको यह बताना है कि सेट 'A' में दिये गये चित्रों का स्थान सेट 'B' में दिए गए चित्रों के स्थान क्रम के बिल्कुल समान है अथवा कुछ भिन्न है। यदि दोनों सेटों के स्थान क्रम में पूर्ण समानता है तो उत्तर 'A' होगा; यदि दो चित्रों के स्थान क्रम में अंतर है तो उत्तर 'B' होगा; यदि तीन चित्रों के स्थान क्रम में अंतर है तो उत्तर 'C' होगा; इसी प्रकार यदि चार चित्रों के स्थान क्रम में अंतर है तो उत्तर 'D' होगा। इस परीक्षण में चित्रों के स्थान क्रम में या तो कोई अंतर नहीं होगा या स्थान क्रम में कम से कम दो और अधिकतम चार अंतर होगा।",
        },
        ...timing,
      ];
    default:
      return figureInstructions(testMin, instructionMin);
  }
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
  return category === "depth" ? 225 : category === "memory" ? 140 : 100;
}

/** The sizes offered in the settings. */
export const PICTURE_SCALES = [75, 100, 125, 140, 150, 200, 225, 250] as const;

/** What each picture test offers by default; the admin may change it per upload. */
export function defaultOptionsFor(category: string): { style: OptionStyle; count: number } {
  switch (category) {
    case "depth":
      return { style: "numbers", count: 10 };
    case "observation":
      return { style: "letters", count: 4 };
    default:
      return { style: "letters", count: DEFAULT_OPTION_COUNT };
  }
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
