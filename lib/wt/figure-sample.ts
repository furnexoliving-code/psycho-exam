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
