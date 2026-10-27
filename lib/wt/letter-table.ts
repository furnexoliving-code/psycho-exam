import type { InstructionBlock, WatchQuestion } from "./types";

/**
 * The Letter Table Test Type-II (2d): the Following Directions test as the
 * railway's second mock link for CEN 01/2025 gives it. Two tables of
 * letters, each a pattern in rows and columns, and questions that name a
 * letter by its row and column and ask which letter stands above, below or
 * beside it. On this portal each table carries ten questions; the mock
 * gave two.
 *
 * It rides the Following Directions engine in parts: Part 1's questions
 * are asked against the first table, Part 2's against the second (see
 * WatchFeatures.partImages).
 */

/** "10 minutes" / "10 मिनट". */
function minutes(n: number, en: boolean): string {
  return en ? `${n} minute${n === 1 ? "" : "s"}` : `${n} मिनट`;
}

/** The instruction screen, in the mock's words with this paper's count and clock written in. */
export function letterTable2Instructions(testMin: number, instructionMin: number, questions = 20, tables = 2): InstructionBlock[] {
  const each = Math.max(1, Math.round(questions / tables));
  return [
    {
      en: `This is a test of your ability to follow a set of directions. In this test there are ${questions} questions based on ${tables} grids. Each grid will have ${each} questions. Each grid will consist of a pattern of letters and you will be asked questions based on that pattern. The answer to each question will be one of the letters in the pattern. You have to find out the letter that shows the correct answer. Give your answer by clicking on the appropriate answer option through the mouse.`,
      hi: `इस परीक्षण द्वारा दिए गए निर्देश समझ सकने की योग्यता की जाँच की जाती है। इस परीक्षण में ${tables} ग्रिड पर आधारित ${questions} प्रश्न हैं। प्रत्येक ग्रिड पर आधारित ${each} प्रश्न हैं। प्रत्येक ग्रिड कुछ अक्षरों का एक समूह होगा तथा उनके ऊपर आधारित आपसे प्रश्न पूछे जाएँगे। प्रश्नों का उत्तर समूह में दिया कोई एक अक्षर होगा। आपको उस अक्षर को ज्ञात करना है जो सही उत्तर प्रदर्शित करता है। अपना उत्तर माउस की सहायता से सही उत्तर विकल्प पर क्लिक करके दें।`,
    },
    {
      en: `The questions come in ${tables} parts, one grid to a part. Press Save & Next to go on to the next grid and its questions; Previous brings the earlier one back.`,
      hi: `प्रश्न ${tables} भागों में आते हैं, हर भाग में एक ग्रिड। अगले ग्रिड और उसके प्रश्नों के लिए Save & Next दबाएँ; Previous से पिछला ग्रिड वापस आता है।`,
    },
    {
      en: `The time limit for the test is ${minutes(testMin, true)}.`,
      hi: `इस परीक्षण हेतु समय सीमा ${minutes(testMin, false)} है।`,
    },
    {
      en: `You have ${minutes(instructionMin, true)} to read these instructions. When that time is over the test begins by itself. Press Skip Instruction to begin sooner.`,
      hi: `इन निर्देशों को पढ़ने के लिए आपके पास ${minutes(instructionMin, false)} हैं। यह समय समाप्त होते ही परीक्षण स्वतः प्रारंभ हो जाएगा। जल्दी शुरू करने के लिए Skip Instruction दबाएँ।`,
    },
  ];
}

/** The mock's own example grid: five rows of five letters. */
const EXAMPLE_GRID = [
  ["A", "B", "C", "D", "E"],
  ["E", "A", "B", "C", "D"],
  ["D", "E", "A", "B", "C"],
  ["C", "D", "E", "A", "B"],
  ["B", "C", "D", "E", "A"],
];

/** The grid drawn as a picture, with the row and column numbers the mock prints. */
export function letterGridSvg(grid: string[][]): string {
  const cell = 44;
  const left = 96;
  const top = 56;
  const cols = grid[0].length;
  const width = left + cols * cell + 16;
  const height = top + grid.length * cell + 12;
  const text = (x: number, y: number, s: string, bold = false, size = 16) =>
    `<text x="${x}" y="${y}" font-size="${size}" font-family="Arial, sans-serif" ${bold ? 'font-weight="bold"' : ""} text-anchor="middle" fill="#222">${s}</text>`;
  const parts = [
    text(left + (cols * cell) / 2, 20, "Column (कॉलम)", true, 14),
    ...grid[0].map((_, c) => text(left + c * cell + cell / 2, 44, String(c + 1), true)),
    ...grid.flatMap((row, r) => [
      `<text x="8" y="${top + r * cell + cell / 2 + 6}" font-size="14" font-family="Arial, sans-serif" font-weight="bold" fill="#222">Row (पंक्ति) ${r + 1}</text>`,
      ...row.map((letter, c) => text(left + c * cell + cell / 2, top + r * cell + cell / 2 + 6, letter)),
    ]),
  ];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#fff"/>${parts.join("")}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** The worked example the mock's instruction screen shows: its grid, two questions, their answers. */
export const LETTER2_EXAMPLE_TEXT: InstructionBlock[] = [
  { en: "The grid of the example, with its rows and columns numbered:", hi: "उदाहरण का ग्रिड, पंक्तियों और कॉलमों के क्रमांक के साथ:", image: letterGridSvg(EXAMPLE_GRID), imageWidthPct: 55 },
  {
    en: "1. Which is the only letter that appears directly above the letter 'A'?",
    hi: "1. ऐसा कौन सा अक्षर है जो 'A' के ठीक ऊपर आता है?",
  },
  {
    en: "2. If one letter occurs more frequently than another, the answer is the most frequently occurring letter; if no letter occurs most frequently, the answer is the letter in the upper left to lower right diagonal.",
    hi: "2. अगर कोई अक्षर दूसरों की तुलना में ज़्यादा बार आता हो तो उत्तर होगा सबसे ज़्यादा बार आने वाला अक्षर; यदि कोई एक अक्षर सबसे ज़्यादा बार न आया हो तो उत्तर होगा ऊपरी बाएँ कोने से नीचे दाएँ कोने तक आने वाला अक्षर।",
  },
  {
    en: "The answer for question 1 is B and for question 2 it is A. Give your answer by clicking on the appropriate answer option through the mouse.",
    hi: "प्रश्न 1 का सही उत्तर B एवं 2 का A है। अपना उत्तर माउस की सहायता से सही उत्तर विकल्प पर क्लिक करके दें।",
  },
];

export const LETTER2_SAMPLE_ID = "letter-table-2-sample";

/** The mock's two grids and four questions, two to a grid, on a two-minute clock: the parts screen before a database exists. */
export function letterTable2SamplePaper() {
  const grids = [
    [
      ["C", "A", "E", "B", "D"],
      ["D", "C", "A", "E", "B"],
      ["B", "D", "C", "A", "E"],
      ["E", "B", "D", "C", "A"],
      ["A", "E", "B", "D", "C"],
    ],
    [
      ["A", "C", "E", "B", "D"],
      ["D", "A", "C", "E", "B"],
      ["B", "D", "A", "C", "E"],
      ["E", "B", "D", "A", "C"],
      ["C", "E", "B", "D", "A"],
    ],
  ];
  const letters = ["A", "B", "C", "D", "E"];
  const ask = (id: string, tableIndex: number, en: string, hi: string, answer: string): WatchQuestion => ({
    id,
    tableIndex,
    prompt: { en, hi },
    options: [...letters],
    answer,
    working: { en: "", hi: "" },
    topic: `Grid ${tableIndex + 1}`,
  });
  const questions: WatchQuestion[] = [
    ask("lt2-q1", 0, "Which letter appears directly above the letter 'C' in Row 4, Column 4?", "पंक्ति 4, कॉलम 4 में स्थित अक्षर 'C' के ठीक ऊपर कौन-सा अक्षर है?", "A"),
    ask("lt2-q2", 0, "Which letter appears directly below the letter 'A' in Row 2, Column 3?", "पंक्ति 2, कॉलम 3 में स्थित अक्षर 'A' के ठीक नीचे कौन-सा अक्षर है?", "C"),
    ask("lt2-q3", 1, "Which letter appears directly below the letter 'C' in Row 2, Column 3?", "पंक्ति 2, कॉलम 3 में स्थित अक्षर 'C' के ठीक नीचे कौन-सा अक्षर है?", "A"),
    ask("lt2-q4", 1, "Which letter appears directly above the letter 'A' in Row 4, Column 4?", "पंक्ति 4, कॉलम 4 में स्थित अक्षर 'A' के ठीक ऊपर कौन-सा अक्षर है?", "C"),
  ];
  const images = grids.map(letterGridSvg);
  return {
    id: LETTER2_SAMPLE_ID,
    kind: "directions" as const,
    category: "letter2",
    title: "Letter Table Test Type-II",
    displayName: "Letter Table Test Type-II - Sample",
    features: { questionsPerPart: 2, partImages: images.slice(1) },
    timeLimitMin: 2,
    instructionTimeLimitMin: 5,
    instructions: letterTable2Instructions(2, 5, 4, 2),
    example: { table: { label: "Example", cells: [] }, text: LETTER2_EXAMPLE_TEXT },
    tables: images.map((imageUrl, i) => ({ label: `Part ${i + 1}`, cells: [], imageUrl })),
    imageUrl: images[0],
    questions,
    resultView: {},
  };
}
