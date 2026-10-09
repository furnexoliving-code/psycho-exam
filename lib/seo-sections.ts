import { TEST_PAGES } from "./seo-tests";

/**
 * The public page of every kind of test in the ALP battery, one under its
 * battery's page: what the hall asks, its own question count and clock
 * (ALPs Guidelines CBT, Jan 2020), a worked example in the guideline's
 * own words, how the screen runs, tips, mistakes, and the questions
 * students ask. Plain data; the page draws it.
 */
export interface SectionPage {
  /** The hall's code: 1a … 5e. */
  code: string;
  slug: string;
  battery: number;
  name: string;
  hindi: string;
  title: string;
  description: string;
  keywords: string[];
  what: string;
  whatHi: string;
  questions: number;
  questionsNote: string;
  minutes: number;
  minutesNote: string;
  /** How the screen runs, step by step. */
  how: string[];
  /** The guideline's worked example: the lines shown, then the answers. */
  example: { lines: string[]; answer: string };
  tips: { h: string; p: string }[];
  mistakes: string[];
  faq: { q: string; a: string }[];
}

/** The line every page carries: the portal runs on a phone, but the hall is a desktop. */
export const DEVICE_TIP = {
  h: "Practise on a laptop or desktop",
  p: "The portal works on a phone too, but the exam hall is a desktop screen with a mouse. Sit every practice paper and Full Mock on a laptop or desktop, so the screen, the mouse and the pace are the ones you will meet on the day.",
};
export const DEVICE_FAQ = {
  q: "Can I practise on my phone?",
  a: "Yes, the portal runs on a phone. But the CBAT is taken on a desktop with a mouse, so Kautilya Classes advises every student to sit the practice papers and Full Mocks on a laptop or desktop: the same screen, the same mouse, the same pace as the hall.",
};

const NO_NEGATIVE = { q: "Is there negative marking?", a: "No. The CBAT has no negative marking. Attempt every question; an unanswered question is a mark lost for certain." };
const PASS_T = { q: "What score do I need?", a: "A T-Score of at least 42 in each of the five tests of the CBAT. The portal shows your T-Score on every paper the moment you submit, measured against everyone who sat it." };
const JOIN = { q: "How do I practise this test?", a: "Full papers of this test, with the hall's question count and clock, and Full Mocks with all five tests, come with a Kautilya Classes package on this portal. Kautilya Classes students get their login from the institute; new students message the team on WhatsApp." };

export const SECTION_PAGES: SectionPage[] = [
  // ───────────────────────── Test 1 · Memory ─────────────────────────
  {
    code: "1a",
    slug: "house-position-test",
    battery: 1,
    name: "House Position Test",
    hindi: "मकान स्थिति परीक्षण",
    title: "RRB ALP House Position Test (Memory 1a): pattern, example, tips",
    description: "House Position Test of the RRB ALP psycho test: memorise a map of houses, then mark where each stood (A to E). 24 questions, 8 minutes. Example, tips, practice.",
    keywords: ["house position test ALP", "RRB ALP memory test map", "house position test psycho", "ALP CBAT memory test 1a", "makan sthiti parikshan"],
    what: "A map with houses and other structures is shown for a fixed time. Then the same map returns with the letters A, B, C, D and E in place of the houses, and the houses are shown numbered below it. For each numbered house you mark the letter that stands where it stood. It is a test of memory for position, the first kind of question in Test 1.",
    whatHi: "मकानों वाला नक्शा कुछ समय दिखाया जाता है। फिर वही नक्शा आता है जिसमें मकानों की जगह A से E अक्षर हैं और नीचे नंबर लगे मकान। हर मकान के लिए वह अक्षर चुनना है जो उसकी जगह पर है।",
    questions: 24,
    questionsNote: "12 + 12",
    minutes: 8,
    minutesNote: "2 min study + 2 min test, twice",
    how: [
      "The instruction screen explains the test with a map and three example houses. Press Skip Instruction to start sooner.",
      "Study screen, Part 1: the map with its houses, for 2 minutes. Nothing can be written; the clock counts down in the toolbar.",
      "Test screen, Part 1: the lettered map at the left, the 12 houses numbered below it, and at the right the 12 questions, each with A to E. Mark the letter where that house stood.",
      "A one-minute break with a summary; then the study screen and test screen of Part 2 open by themselves. Submit, or the clock submits for you.",
    ],
    example: {
      lines: ["Study the map: a church, a school, a well, three houses and a tree along two roads.", "Test page: the same map with A, B, C, D, E at the buildings, and houses 1, 2, 3 below.", "Where did house 1 stand? house 2? house 3?"],
      answer: "In the guideline's example the answers are A, C and B.",
    },
    tips: [
      { h: "Walk the map in one order", p: "Start at the top left and go along each road the same way every time. A house is then remembered as the third thing on the lower road, not as a spot in empty space." },
      { h: "Tie each house to its neighbour", p: "The house beside the tree, the house across from the well. A neighbour is easier to recall than a position, and the lettered map keeps every neighbour." },
      { h: "Look for the odd one", p: "A house that is different, larger, or alone is the anchor; fix it first, then place the rest around it." },
      { h: "Use the whole study time", p: "Two minutes is longer than it feels. Do a first pass to see, a second to fix, a third to test yourself silently." },
      DEVICE_TIP,
      { h: "Answer every question", p: "There is no negative marking. If a house is lost, mark your best guess and move on; the clock is short." },
    ],
    mistakes: ["Staring at the whole map instead of reading it along the roads.", "Memorising what the houses look like, when the question is only where they stood.", "Spending Part 2's study time regretting Part 1.", "Leaving the last questions blank when the clock runs down."],
    faq: [
      { q: "How many questions does the House Position Test have?", a: "24, in two parts of 12, with 2 minutes to study each map and 2 minutes to answer, as the RDSO guideline gives it. The portal's papers follow the same pattern." },
      { q: "Do the houses on the test page look the same as on the study map?", a: "Yes. The test page shows the houses themselves, numbered, so you can match each by its look; only its place on the map has become a letter." },
      NO_NEGATIVE, PASS_T, DEVICE_FAQ, JOIN,
    ],
  },
  {
    code: "1b",
    slug: "figure-to-number-test",
    battery: 1,
    name: "Figure to Number Test",
    hindi: "आकृति-अंक परीक्षण",
    title: "RRB ALP Figure to Number Test (Memory 1b): pattern, example, tips",
    description: "Figure to Number Test of the RRB ALP psycho test: memorise picture-number pairs, then pick each picture's number. 42 questions, 12 minutes. Tips, practice.",
    keywords: ["figure to number test ALP", "picture number memory test RRB", "ALP CBAT memory test 1b", "aakriti ank parikshan", "ALP psycho test picture number"],
    what: "A set of pictures is shown, each with a two-digit number beside it, for a fixed time. Then the pictures return in a different order, each with four numbers A, B, C and D; you pick the number that went with that picture. It tests memory for pairs: a picture and its number.",
    whatHi: "चित्र और उनके साथ दो अंकों की संख्या कुछ समय दिखाई जाती है। फिर चित्र अलग क्रम में आते हैं, हर एक के साथ चार संख्याएँ A, B, C, D; जो संख्या उस चित्र के साथ थी वह चुननी है।",
    questions: 42,
    questionsNote: "21 + 21",
    minutes: 12,
    minutesNote: "3 min study + 3 min test, twice",
    how: [
      "The instruction screen shows six example pairs and their answers. Press Skip Instruction to start sooner.",
      "Study screen, Part 1: the pictures with their numbers, for 3 minutes.",
      "Test screen, Part 1: one row per picture, the picture at the left, four numbers in boxes with A, B, C, D beneath, then the four radios. 21 questions.",
      "A one-minute break with a summary; then Part 2 opens by itself. Submit, or the clock submits for you.",
    ],
    example: {
      lines: ["Study page: a bell 75, a lock 42, a cup 64, a star 28, a key 93, a leaf 17.", "Test page, item 1: the lock · A-39 B-93 C-58 D-24.", "Item 2: the key · A-56 B-42 C-98 D-55."],
      answer: "The guideline's answers for its six items are B, B, A, C, D and C.",
    },
    tips: [
      { h: "Make the number mean something", p: "A bell with 75: say 'the bell rang 75 times'. A number tied to a tiny story survives three minutes; a bare number does not." },
      { h: "Say the pair aloud in your head", p: "Picture, number, picture, number, in one rhythm. The sound of the pair is a second copy of it." },
      { h: "Study in rounds, not in one stare", p: "Three minutes allows three or four rounds through 21 pairs. Each round, skip the ones that are fixed and spend the time on the weak ones." },
      { h: "On the test page, eliminate first", p: "Two of the four numbers are usually far from anything you saw. Strike them, and the choice is between two." },
      DEVICE_TIP,
      { h: "Answer every question", p: "No negative marking. A guess between two numbers wins half the time; a blank never does." },
    ],
    mistakes: ["Memorising the pictures but not the numbers, then recognising every picture and knowing no number.", "Trying to hold all 21 pairs at once instead of in rounds.", "Changing a sure answer after a doubtful one shakes you.", "Running out of time on Part 1 and reaching Part 2 tired; the break is for breathing."],
    faq: [
      { q: "How many questions does the Figure to Number Test have?", a: "42, in two parts of 21, with 3 minutes to study and 3 minutes to answer in each part, as the RDSO guideline gives it. The portal follows the same pattern." },
      { q: "Are the numbers always two digits?", a: "In the guideline's examples every number has two digits, and the four options of a question are all two-digit numbers, so the choice is never by length." },
      NO_NEGATIVE, PASS_T, DEVICE_FAQ, JOIN,
    ],
  },
  {
    code: "1c",
    slug: "railway-track-route-test",
    battery: 1,
    name: "Railway Track Route Test",
    hindi: "रेलवे ट्रैक रूट परीक्षण",
    title: "RRB ALP Railway Track Route Test (Memory 1c): pattern, tips",
    description: "Railway Track Route Test of the RRB ALP psycho test: memorise stations on a map, then mark each one's letter. 24 questions, 8 minutes. Example, tips, practice.",
    keywords: ["railway track route test ALP", "railway map memory test RRB", "ALP CBAT memory test 1c", "station memory test psycho", "railway track route test psycho"],
    what: "A railway map is shown with the names of some stations on it, for a fixed time. Then the same map returns with the letters A to E in place of the stations, and the station names beside it. For each station you mark the letter that stands where it was. It is the memory test the RDSO mock portal itself shows first.",
    whatHi: "एक रेलवे मानचित्र कुछ स्टेशनों के नाम के साथ कुछ समय दिखाया जाता है। फिर वही मानचित्र स्टेशनों की जगह A से E अक्षरों के साथ आता है और पास में स्टेशनों के नाम। हर स्टेशन के लिए उसकी जगह वाला अक्षर चुनना है।",
    questions: 24,
    questionsNote: "12 + 12",
    minutes: 8,
    minutesNote: "2 min study + 2 min test, twice",
    how: [
      "The instruction screen shows an example map with three stations (SOK, DET, PIR) and its lettered test map. Press Skip Instruction to start sooner.",
      "Study screen, Part 1: the railway map with its station names, for 2 minutes. Broad gauge and metre gauge are drawn differently; a station is a dot.",
      "Test screen, Part 1: the lettered map at the left with the station names beside it; at the right one question per station, each with A to E.",
      "A one-minute break with a summary; then Part 2's study and test screens open by themselves. Submit, or the clock submits for you.",
    ],
    example: {
      lines: ["Study map: SOK at the top of the branch line, DET on the main line to the right, PIR on the lower branch.", "Test map: letters A to E at the stations.", "1. DET   2. PIR   3. SOK"],
      answer: "The guideline's answers are C for DET, A for PIR and B for SOK.",
    },
    tips: [
      { h: "Follow the track like a train", p: "Start where the lines meet and travel each branch. A station is then 'second on the upper branch', which the lettered map still shows." },
      { h: "Use the gauge as a landmark", p: "Broad gauge and metre gauge are drawn with different sleepers. A station on the thin line can never be on the thick one." },
      { h: "Say the name with its place", p: "'SOK at the top', 'PIR at the bottom'. Three short phrases are easier than a picture of the whole map." },
      { h: "Count the dots", p: "The test map keeps every dot, lettered or not. If the study map had five dots and the names were on the first, third and fifth, the letters you need are on the same dots." },
      DEVICE_TIP,
      { h: "Answer every question", p: "No negative marking. Mark the best guess for a lost station and keep the clock for the sure ones." },
    ],
    mistakes: ["Reading the station names without reading the map, then knowing the names and not the places.", "Forgetting that unnamed dots on the study map are also lettered on the test map.", "Hunting for a station's look; on the test map every station is the same dot.", "Leaving Part 2 questions blank because the break felt long."],
    faq: [
      { q: "How many questions does the Railway Track Route Test have?", a: "24, in two parts of 12, with 2 minutes to study and 2 minutes to answer in each part, as the RDSO guideline gives it. The RDSO mock portal's sample runs it with three stations a part; the portal here follows the hall's count." },
      { q: "Are the names written on the test map?", a: "No. On the test map the stations carry only letters; the names are listed beside the map, and each question is one name." },
      NO_NEGATIVE, PASS_T, DEVICE_FAQ, JOIN,
    ],
  },
  {
    code: "1d",
    slug: "figure-to-figure-test",
    battery: 1,
    name: "Figure to Figure Test",
    hindi: "आकृति-आकृति परीक्षण",
    title: "RRB ALP Figure to Figure Test (Memory 1d): pattern, example, tips",
    description: "Figure to Figure Test of the RRB ALP psycho test: memorise pairs of shapes, then find each shape's partner among four. 40 questions, 12 minutes. Tips, practice.",
    keywords: ["figure to figure test ALP", "pairs of shapes memory test RRB", "ALP CBAT memory test 1d", "aakriti aakriti parikshan", "memory test pairs psycho"],
    what: "Pairs of shapes are shown on a memory screen for a fixed time. Then, on the answer screen, each shape appears with four shapes A, B, C and D beside it; you pick the one that was paired with it. It tests memory for an association between two pictures.",
    whatHi: "आकृतियों के जोड़े स्मृति स्क्रीन पर कुछ समय दिखाए जाते हैं। फिर उत्तर स्क्रीन पर हर आकृति के साथ चार आकृतियाँ A, B, C, D आती हैं; जो उसके साथ जुड़ी थी वह चुननी है।",
    questions: 40,
    questionsNote: "20 + 20",
    minutes: 12,
    minutesNote: "3 min study + 3 min test, twice",
    how: [
      "The instruction screen shows an example memory page and answer page with four items. Press Skip Instruction to start sooner.",
      "Memory screen, Part 1: the pairs of shapes, for 3 minutes.",
      "Answer screen, Part 1: one row per item, the shape at the left, four shapes with A, B, C, D beneath, then the radios. 20 questions.",
      "A one-minute break with a summary; then Part 2 opens by itself. Submit, or the clock submits for you.",
    ],
    example: {
      lines: ["Memory page: a circle with a triangle, a square with a star, a cross with an arrow, a crescent with a diamond.", "Answer page, item 1: the circle · A triangle, B star, C arrow, D diamond."],
      answer: "In the guideline's example the answers for items 1 to 4 are A, D, A and B.",
    },
    tips: [
      { h: "Turn each pair into one picture", p: "A circle with a triangle: see a triangle inside the circle. One joined picture is remembered as one thing, not two." },
      { h: "Name the pair", p: "'Circle-triangle', 'square-star'. A two-word name is a second copy of the pair, held as sound." },
      { h: "Study in rounds", p: "Three minutes over 20 pairs is three or four rounds. Skip the fixed ones each round; spend the time on the weak ones." },
      { h: "Eliminate on the answer screen", p: "Shapes that never appeared on the memory screen can be struck at once; the choice is usually between two." },
      DEVICE_TIP,
      { h: "Answer every question", p: "No negative marking. A guess between two shapes wins half the time." },
    ],
    mistakes: ["Memorising each shape alone, so every shape is familiar and no pairing is known.", "Confusing a pair's partner with a shape that was in another pair.", "Spending the first minute of the answer screen re-reading the instructions.", "Leaving the last items blank when the clock runs down."],
    faq: [
      { q: "How many questions does the Figure to Figure Test have?", a: "40, in two parts of 20, with 3 minutes to memorise and 3 minutes to answer in each part, as the RDSO guideline gives it. The portal follows the same pattern." },
      { q: "Is it the same as the Figure Find Test?", a: "No. In the Figure Find Test you memorise sets of shapes and find each set among five. Here you memorise pairs, and for one shape you find its partner among four." },
      NO_NEGATIVE, PASS_T, DEVICE_FAQ, JOIN,
    ],
  },
  {
    code: "1e",
    slug: "figure-find-test",
    battery: 1,
    name: "Figure Find Test",
    hindi: "आकृति खोज परीक्षण",
    title: "RRB ALP Figure Find Test (Memory 1e): pattern, example, tips",
    description: "Figure Find Test of the RRB ALP psycho test: memorise sets of shapes, then find each set among five. 24 questions, 8 minutes. Worked example, tips, practice.",
    keywords: ["figure find test ALP", "sets of shapes memory test RRB", "ALP CBAT memory test 1e", "aakriti khoj parikshan", "ALP memory test figure find"],
    what: "Sets of shapes are shown on a study screen for a fixed time. Then, for each question, five sets A to E are shown and one of them is exactly a set you saw; you find it. It is the newest form of the Memory Test and the one most students meet first on the portal.",
    whatHi: "आकृतियों के सेट अध्ययन स्क्रीन पर कुछ समय दिखाए जाते हैं। फिर हर प्रश्न में पाँच सेट A से E आते हैं, जिनमें से एक बिल्कुल वही है जो आपने देखा था; उसे खोजना है।",
    questions: 24,
    questionsNote: "12 + 12",
    minutes: 8,
    minutesNote: "2 min study + 2 min test, twice",
    how: [
      "The instruction screen shows an example study page and test page. Press Skip Instruction to start sooner.",
      "Study screen, Part 1: the sets of shapes, for 2 minutes.",
      "Test screen, Part 1: each question is a strip of five sets with A to E, then the radios; pick the set that was on the study screen. 12 questions.",
      "A one-minute break with a summary; then Part 2 opens by itself. Submit, or the clock submits for you.",
    ],
    example: {
      lines: ["Study page: a square-circle-triangle set, a star-cross-dot set, a diamond-line-arc set.", "Test page, item 1: five sets, one of them square-circle-triangle in that order."],
      answer: "In the guideline's example the answers for items 1 to 3 are A, C and E.",
    },
    tips: [
      { h: "Read a set as a word", p: "Square, circle, triangle: 'SCT'. The order matters, and a three-letter word holds the order." },
      { h: "Spot what the wrong options share", p: "The four wrong sets usually reuse the same shapes in another order or with one swapped. Check the order first, then the odd shape." },
      { h: "Study in rounds", p: "Two minutes over 12 sets is three rounds. Each round, pass over the fixed sets and fix the weak ones." },
      { h: "Keep the first impression", p: "If a set looks right at once, it usually is. Doubt creeps in with staring; mark and move." },
      DEVICE_TIP,
      { h: "Answer every question", p: "No negative marking. Strike the sets with a shape you never saw, then guess among the rest." },
    ],
    mistakes: ["Memorising the shapes but not their order within the set.", "Looking for a set that is 'nearly' right; the answer is exactly right.", "Changing answers on Part 1 in the last seconds instead of finishing.", "Practising the same study set until it is recognised, not remembered."],
    faq: [
      { q: "How many questions does the Figure Find Test have?", a: "24, in two parts of 12, with 2 minutes to study and 2 minutes to answer in each part, as the RDSO guideline gives it. The portal follows the same pattern." },
      { q: "Is the Figure Find Test the Memory Test?", a: "It is one of the five kinds of the Memory Test (Test 1). The hall may give any of them; the portal has papers for all five." },
      NO_NEGATIVE, PASS_T, DEVICE_FAQ, JOIN,
    ],
  },

  // ─────────────────── Test 2 · Following Directions ───────────────────
  {
    code: "2a",
    slug: "letter-table-test",
    battery: 2,
    name: "Letter Table Test",
    hindi: "लेटर टेबल टेस्ट",
    title: "RRB ALP Letter Table Test (Following Directions 2a): pattern, tips",
    description: "Letter Table Test of the RRB ALP psycho test: a grid of letters, questions on rows, columns and reversals. 10 questions, 5 minutes. Example, rules, practice.",
    keywords: ["letter table test ALP", "letter table test RRB psycho", "following directions test letter table", "ALP CBAT 2a", "letter table test questions"],
    what: "A pattern of letters in rows and columns is shown. Each question describes a change or a path in that pattern ('if Row I and III are reversed, which letter comes below C in Row II?') and the answer is one of the letters. You decide which letter the directions point to.",
    whatHi: "अक्षरों की पंक्तियों और स्तंभों का एक पैटर्न दिखाया जाता है। हर प्रश्न में पैटर्न में कोई बदलाव या रास्ता बताया जाता है, और उत्तर पैटर्न का कोई एक अक्षर होता है।",
    questions: 10,
    questionsNote: "",
    minutes: 5,
    minutesNote: "",
    how: [
      "The instruction screen shows the table with an example question and its answer. Press Skip Instruction to start sooner.",
      "The test screen keeps the letter table at the left and the 10 questions at the right, each with its five letters. The mouse wheel is off, as in the hall; the scrollbar still moves.",
      "Read the direction, apply it to the table in your head, mark the letter. Save & Next is not needed; every answer is kept as you choose it.",
      "Submit, or the clock submits for you. Your T-Score appears at once.",
    ],
    example: {
      lines: ["Which is the only letter that appears directly above 'A'?", "If Row I and III are written in reverse order, which letter will come below C in Row II?"],
      answer: "In the guideline's example the first answer is B; the twenty practice answers run D, E, B, C, A, A, D, B, C, E, D, D, D, C, A, A, E, E, C, E.",
    },
    tips: [
      { h: "Number the rows and columns in your head", p: "Row I to V, Column I to V, before the first question. Every direction then becomes two numbers." },
      { h: "Reverse means mirror", p: "A reversed row reads right to left; the middle letter stays. Picture the mirror, do not rewrite the row." },
      { h: "Do the 'if ever' questions in two halves", p: "'If D appears to the right of C in Row IV, answer the last letter; if not, the middle of Row III.' First decide the if; only then read the answer half." },
      { h: "One question, one pass", p: "Thirty seconds a question. If a path is lost, mark the best guess and return if time remains." },
      DEVICE_TIP,
      { h: "Answer every question", p: "No negative marking. The last two questions are often the easiest; reach them." },
    ],
    mistakes: ["Counting from the wrong end after a reversal.", "Mixing rows and columns under time pressure.", "Reading the answer half of an 'if' question before deciding the if.", "Spending two minutes on one path and leaving three questions blank."],
    faq: [
      { q: "How many questions does the Letter Table Test have?", a: "10 in 5 minutes, as the RDSO guideline gives it. The portal's papers follow the same count and clock." },
      { q: "Is the Letter Table the same as the Watch Table?", a: "No. The Watch Table is a circle with letters and numbers and a compass; the Letter Table is a grid of letters with questions about rows and columns. Both are forms of the Following Directions Test (Test 2), with the Number Table the third." },
      NO_NEGATIVE, PASS_T, DEVICE_FAQ, JOIN,
    ],
  },
  {
    code: "2b",
    slug: "watch-table-test",
    battery: 2,
    name: "Watch Table Test",
    hindi: "वॉच टेबल टेस्ट",
    title: "RRB ALP Watch Table Test (Following Directions 2b): pattern, tips",
    description: "Watch Table Test of the RRB ALP psycho test: letters and numbers round a circle with a compass; follow the directions. 20 questions, 10 minutes. Tips, practice.",
    keywords: ["watch table test ALP", "watch table test RRB psycho", "watch table test questions", "following directions test watch table", "ALP CBAT 2b"],
    what: "Eight letters sit around a circle, each with a number in a square, and the centre shows the compass directions. A question names a start, a direction and a path ('moving from North to East by the shortest route, which number appears between the two?') and the answer is one of the numbers in the squares.",
    whatHi: "एक गोले पर आठ अक्षर हैं, हर एक के साथ वर्ग में एक संख्या, और बीच में दिशाएँ। प्रश्न में शुरुआत, दिशा और रास्ता बताया जाता है; उत्तर वर्ग की कोई संख्या होती है।",
    questions: 20,
    questionsNote: "",
    minutes: 10,
    minutesNote: "",
    how: [
      "The instruction screen shows the circle with two example questions and their answers. Press Skip Instruction to start sooner.",
      "The test screen keeps the watch table at the left and the 20 questions at the right, each with its numbers. The mouse wheel is off, as in the hall.",
      "Read the direction, travel the circle in your head, mark the number. Every answer is kept as you choose it.",
      "Submit, or the clock submits for you. Your T-Score appears at once.",
    ],
    example: {
      lines: ["Which number appears just opposite to the number between B3 and D2?", "While moving from North to East by the shortest route, which number appears in between the two?"],
      answer: "In the guideline's example the answers are 5 and 2.",
    },
    tips: [
      { h: "Fix the eight directions first", p: "North at the top, then NE, E, SE, S, SW, W, NW clockwise. Say them once before the first question; every path uses them." },
      { h: "Right-handed is clockwise", p: "Right-handedly means clockwise, left-handedly anticlockwise. Decide the direction of travel before counting a single step." },
      { h: "Opposite is four steps away", p: "The position opposite any point is four places on, either way round. Count once, not both ways." },
      { h: "Count positions, not letters", p: "Letters repeat nowhere, numbers repeat; the question is about the number under the position you reach." },
      DEVICE_TIP,
      { h: "Answer every question", p: "No negative marking. Thirty seconds a question; mark and move." },
    ],
    mistakes: ["Travelling anticlockwise for 'right-handedly'.", "Counting the start position as the first step.", "Reading 'between' as 'next to'.", "Leaving the last questions blank after a slow start."],
    faq: [
      { q: "How many questions does the Watch Table Test have?", a: "20 in 10 minutes, as the RDSO guideline gives it. The portal's papers follow the same count and clock, with the circle drawn as the hall draws it." },
      { q: "Which tests make up Following Directions?", a: "The Watch Table, the Letter Table and the Number Table are the three forms of Test 2. The hall gives one of them; the portal has papers for all three." },
      NO_NEGATIVE, PASS_T, DEVICE_FAQ, JOIN,
    ],
  },
  {
    code: "2c",
    slug: "number-table-test",
    battery: 2,
    name: "Number Table Test",
    hindi: "नंबर टेबल टेस्ट",
    title: "RRB ALP Number Table Test (Following Directions 2c): pattern, tips",
    description: "Number Table Test of the RRB ALP psycho test: a grid of numbers, questions on rows, columns and reversals. 10 questions, 5 minutes. Example, rules, practice.",
    keywords: ["number table test ALP", "number table test RRB psycho", "following directions test number table", "ALP CBAT 2c", "number table test questions"],
    what: "A pattern of numbers in rows and columns is shown. Each question describes a change or a path in that pattern ('which is the only number that appears directly above 1?') and the answer is one of the numbers. The form is the Letter Table's, with numbers in place of letters.",
    whatHi: "संख्याओं की पंक्तियों और स्तंभों का पैटर्न दिखाया जाता है। हर प्रश्न में पैटर्न में बदलाव या रास्ता बताया जाता है; उत्तर पैटर्न की कोई एक संख्या होती है।",
    questions: 10,
    questionsNote: "",
    minutes: 5,
    minutesNote: "",
    how: [
      "The instruction screen shows the table with an example question. Press Skip Instruction to start sooner.",
      "The test screen keeps the number table at the left and the 10 questions at the right, each with its numbers. The mouse wheel is off, as in the hall.",
      "Read the direction, apply it to the table, mark the number. Every answer is kept as you choose it.",
      "Submit, or the clock submits for you. Your T-Score appears at once.",
    ],
    example: {
      lines: ["Which is the only number that appears directly above the number '1'?"],
      answer: "In the guideline's example the answer is 2.",
    },
    tips: [
      { h: "Number the rows and columns", p: "Row I to V and Column I to V before the first question; a direction then becomes two numbers you can hold." },
      { h: "Reverse means mirror", p: "A reversed row reads right to left; the middle stays. Picture it, do not rewrite it." },
      { h: "Watch for repeated numbers", p: "A number may appear more than once in the table. 'Directly above 1' means the 1 the question points to; find that 1 first." },
      { h: "One pass, thirty seconds each", p: "Mark the best guess on a lost path and come back with what time remains." },
      DEVICE_TIP,
      { h: "Answer every question", p: "No negative marking." },
    ],
    mistakes: ["Picking the first 1 you see when the table has two.", "Counting from the wrong end after a reversal.", "Mixing rows and columns.", "Leaving questions blank."],
    faq: [
      { q: "How many questions does the Number Table Test have?", a: "10 in 5 minutes, as the RDSO guideline gives it. The portal's papers follow the same count and clock." },
      { q: "How is it different from the Letter Table?", a: "Only in what fills the grid: numbers instead of letters. The questions, the reversals and the paths are the same kind." },
      NO_NEGATIVE, PASS_T, DEVICE_FAQ, JOIN,
    ],
  },

  // ───────────────────── Test 3 · Depth Perception ─────────────────────
  {
    code: "3a",
    slug: "brick-test",
    battery: 3,
    name: "Brick Test",
    hindi: "ईंट परीक्षण",
    title: "RRB ALP Brick Test (Depth Perception 3a): pattern, example, tips",
    description: "Brick Test of the RRB ALP psycho test: a pile of bricks lettered A to E; count the bricks touching each. 50 questions, 5 minutes. Example, tips, practice.",
    keywords: ["brick test ALP", "brick test RRB psycho", "depth perception test brick", "ALP CBAT 3a", "brick counting test railway"],
    what: "A pile of bricks is drawn, all of the same size and shape, with some bricks labelled A, B, C, D and E. For each lettered brick you count how many other bricks touch it. Ten piles, five questions each, make the 50 questions of the test.",
    whatHi: "एक ही आकार की ईंटों का ढेर बना है, कुछ ईंटों पर A, B, C, D, E लिखा है। हर अक्षर वाली ईंट के लिए गिनना है कि कितनी ईंटें उसे छू रही हैं। दस ढेर, हर एक में पाँच प्रश्न।",
    questions: 50,
    questionsNote: "10 piles × 5",
    minutes: 5,
    minutesNote: "",
    how: [
      "The instruction screen shows an example pile and its five answers. Press Skip Instruction to start sooner.",
      "The test screen shows one pile at the left and its five questions at the right: 1. A, 2. B … 5. E, each with the numbers to choose from. Options past the right edge are reached with the scrollbar, as in the hall.",
      "Save & Next opens the next pile; the questions continue 6 to 10, and so on to 50.",
      "Submit, or the clock submits for you. Your T-Score appears at once.",
    ],
    example: {
      lines: ["In the guideline's pile, brick A touches two others, D and E.", "Bricks B, C, D and E touch 3, 3, 4 and 4 bricks."],
      answer: "So the answers are A 2, B 3, C 3, D 4, E 4.",
    },
    tips: [
      { h: "Touch means any contact", p: "A brick above, below, beside, or behind that shares a face or an edge counts. Hidden bricks count too, if the drawing shows they must be there." },
      { h: "Count in a fixed order", p: "Above, below, left, right, front, back. The same six checks for every brick; nothing is missed and nothing is counted twice." },
      { h: "Picture the hidden ones", p: "A brick on top must rest on something. If the drawing hides it, it is still there, and it still touches." },
      { h: "Six seconds a question", p: "Fifty questions in five minutes. Count once, mark, move; the next pile is waiting." },
      DEVICE_TIP,
      { h: "Answer every question", p: "No negative marking. A pile that confuses you is worth five guesses, not five blanks." },
    ],
    mistakes: ["Counting only the bricks that are visible.", "Counting a brick twice because it touches on two sides.", "Treating a brick at a corner as touching when it only meets at a point.", "Spending a minute on one pile and leaving the last two piles blank."],
    faq: [
      { q: "How many questions does the Brick Test have?", a: "50 in 5 minutes: ten piles, five lettered bricks each, as the RDSO guideline gives it. The portal's papers follow the same pattern." },
      { q: "Is the Brick Test the same as the Hidden Cube Test?", a: "No. Both are Depth Perception (Test 3). In the Brick Test you count the bricks touching a lettered brick; in the Hidden Cube Test you count the blocks hidden on every side by the others." },
      NO_NEGATIVE, PASS_T, DEVICE_FAQ, JOIN,
    ],
  },
  {
    code: "3b",
    slug: "hidden-cube-test",
    battery: 3,
    name: "Hidden Cube Test",
    hindi: "छिपे घन परीक्षण",
    title: "RRB ALP Hidden Cube Test (Depth Perception 3b): pattern, tips",
    description: "Hidden Cube Test of the RRB ALP psycho test: count the blocks hidden on every side in a pile. 50 questions, 10 minutes. The counting method, example, practice.",
    keywords: ["hidden cube test ALP", "hidden cube test RRB psycho", "depth perception test cube", "ALP CBAT 3b", "cube counting test railway"],
    what: "Each question is a pile of blocks of the same shape and size. You count the blocks whose every side and corner is hidden by the other blocks. The guideline's rule: there are always three blocks in the base of the farthest row.",
    whatHi: "हर प्रश्न में एक ही आकार के गुटकों का ढेर है। उन गुटकों को गिनना है जिनकी सभी सतहें और किनारे दूसरे गुटकों से छिपे हैं। नियम: सबसे पीछे की पंक्ति के आधार में सदैव तीन गुटके होते हैं।",
    questions: 50,
    questionsNote: "",
    minutes: 10,
    minutesNote: "",
    how: [
      "The instruction screen shows three practice piles with their answers (2, 4 and 3). Press Skip Instruction to start sooner.",
      "The test screen shows the piles in parts, each pile with its numbered options on one line. Save & Next moves to the next part.",
      "Count the hidden blocks, mark the number, move on. Every answer is kept as you choose it.",
      "Submit, or the clock submits for you. Your T-Score appears at once.",
    ],
    example: {
      lines: ["Practice Problem I: two blocks are completely hidden, no side or corner visible.", "Practice Problems II and III."],
      answer: "The guideline's answers are 2, 4 and 3.",
    },
    tips: [
      { h: "Use the three-block rule", p: "The farthest row's base always has three blocks. Build the pile from the back: that row tells you how many blocks can be behind what you see." },
      { h: "Count by layers", p: "Bottom layer first, then the next. A block is hidden only when the layer above covers it and blocks stand in front and beside it." },
      { h: "A visible corner is not hidden", p: "If any edge or corner shows, the block is out. The question is about blocks you cannot see at all." },
      { h: "Twelve seconds a question", p: "Fifty in ten minutes. A pile that takes longer gets a guess and a return later." },
      DEVICE_TIP,
      { h: "Answer every question", p: "No negative marking." },
    ],
    mistakes: ["Forgetting the three-block base rule and under-counting the back row.", "Counting blocks whose top edge shows.", "Rebuilding the whole pile for every question instead of counting layers.", "Leaving piles blank at the end."],
    faq: [
      { q: "How many questions does the Hidden Cube Test have?", a: "50 in 10 minutes, as the RDSO guideline gives it. The portal's papers follow the same count and clock." },
      { q: "What does 'hidden' mean exactly?", a: "A block all of whose sides and corners are covered by other blocks, so that nothing of it can be seen from the viewing side. The guideline's first practice problem has two such blocks." },
      NO_NEGATIVE, PASS_T, DEVICE_FAQ, JOIN,
    ],
  },

  // ─────────────────── Test 4 · Power of Observation ───────────────────
  {
    code: "4a",
    slug: "yes-or-no-test",
    battery: 4,
    name: "Yes or No Test",
    hindi: "हाँ या नहीं परीक्षण",
    title: "RRB ALP Yes or No Test (Power of Observation 4a): pattern, tips",
    description: "Yes or No Test of the RRB ALP psycho test: two numbers side by side, Y if the same, N if not. 96 questions, 4 minutes. Example, how to compare fast, practice.",
    keywords: ["yes or no test ALP", "yes no test RRB psycho", "power of observation test number comparison", "ALP CBAT 4a", "same or different numbers test"],
    what: "Each question is two numbers side by side. If they are the same you select Y, otherwise N. It measures how quickly and accurately you compare two numbers; the clock is the test.",
    whatHi: "हर प्रश्न में दो संख्याएँ आमने-सामने हैं। एक जैसी हों तो Y, नहीं तो N। यह जाँचता है कि आप कितनी तेज़ी और सटीकता से दो संख्याओं की तुलना करते हैं।",
    questions: 96,
    questionsNote: "",
    minutes: 4,
    minutesNote: "",
    how: [
      "The instruction screen shows five example pairs with their answers (Y, N, N, Y, N). Press Skip Instruction to start sooner.",
      "The test screen lists the pairs, each with Y and N; 24 to a part, Save & Next to the next part.",
      "Compare, mark, next. Every answer is kept as you choose it.",
      "Submit, or the clock submits for you. Your T-Score appears at once.",
    ],
    example: {
      lines: ["589 = 589", "2768 = 2786", "36463 = 36462", "712963 = 712963", "487562 = 487652"],
      answer: "The answers are Y, N, N, Y and N.",
    },
    tips: [
      { h: "Read in chunks of three", p: "487 562 against 487 652: the second chunk differs. Chunks are faster than digit by digit and safer than a glance." },
      { h: "Expect the swap", p: "The commonest difference is two neighbouring digits swapped (2768 / 2786). A glance misses it; a chunk catches it." },
      { h: "Check the ends", p: "A changed first or last digit hides in plain sight. Make the ends part of the first chunk and the last." },
      { h: "Two and a half seconds each", p: "96 in 4 minutes. Do not re-check; a first careful read is right far more often than a hurried second one." },
      DEVICE_TIP,
      { h: "Answer every question", p: "No negative marking. If the clock is running out, mark the rest Y or N rather than leave them." },
    ],
    mistakes: ["Glancing at the length and the first digits only.", "Missing a swapped pair in the middle.", "Slowing down after one mistake.", "Leaving the last part untouched when the clock runs down."],
    faq: [
      { q: "How many questions does the Yes or No Test have?", a: "96 in 4 minutes, as the RDSO guideline gives it. The portal's papers follow the same count and clock, and the portal builds fresh pairs for every paper." },
      { q: "How many digits do the numbers have?", a: "From three to nine in the guideline's practice set. Both numbers of a pair are always the same length; the difference, when there is one, is in the digits." },
      NO_NEGATIVE, PASS_T, DEVICE_FAQ, JOIN,
    ],
  },
  {
    code: "4b",
    slug: "find-6-test",
    battery: 4,
    name: "Find 6 Test",
    hindi: "6 खोजो परीक्षण",
    title: "RRB ALP Find 6 Test (Power of Observation 4b): pattern, tips",
    description: "Find 6 Test of the RRB ALP psycho test: four groups of digits, which holds a 6? More than one, E. 75 questions, 4 minutes. Example, method, practice papers.",
    keywords: ["find 6 test ALP", "find six test RRB psycho", "power of observation test find 6", "ALP CBAT 4b", "digit search test railway"],
    what: "Each question has four groups of digits, A, B, C and D. You find the group that contains a 6. If the 6 appears in more than one group, the answer is E. The test is speed of scanning for one digit.",
    whatHi: "हर प्रश्न में अंकों के चार समूह A, B, C, D हैं। जिस समूह में 6 है वह चुनना है। 6 एक से अधिक समूहों में हो तो उत्तर E।",
    questions: 75,
    questionsNote: "",
    minutes: 4,
    minutesNote: "",
    how: [
      "The instruction screen shows practice rows with their answers. Press Skip Instruction to start sooner.",
      "The test screen lists the questions, four lettered groups and then A to E; 25 to a part, Save & Next to the next part.",
      "Scan the four groups for a 6, mark the letter (or E), next.",
      "Submit, or the clock submits for you. Your T-Score appears at once.",
    ],
    example: {
      lines: ["A 72383514   B 98734521   C 12947685   D 39587421", "A 1354931582   B 2943587138   C 7823945125   D 4793268251"],
      answer: "The guideline's answers for its first rows are C and D; across its twenty practice rows E appears three times.",
    },
    tips: [
      { h: "Hunt the shape, not the value", p: "A 6 is a closed loop at the bottom with a tail at the top. Let the eye look for that shape; reading the digits as numbers is slower." },
      { h: "Scan all four before marking", p: "The E rule means a 6 in A is not the end. One sweep across A, B, C, D, then mark." },
      { h: "Do not confuse 6 with 9 or 8", p: "Under time pressure a 9 upside down looks like a 6. A 6's loop is at the bottom; a 9's at the top." },
      { h: "Three seconds a question", p: "75 in 4 minutes. One sweep, one mark." },
      DEVICE_TIP,
      { h: "Answer every question", p: "No negative marking." },
    ],
    mistakes: ["Marking the first group with a 6 without checking the rest for E.", "Mistaking an 8 or a 9 for a 6.", "Re-reading a group twice for safety and losing the clock.", "Leaving the last part blank."],
    faq: [
      { q: "How many questions does the Find 6 Test have?", a: "75 in 4 minutes, as the RDSO guideline gives it. The portal builds fresh questions for every paper, with the 6 in exactly one group most of the time and in two or three groups about one question in six." },
      { q: "What if no group has a 6?", a: "In the guideline's practice set every question has the 6 in at least one group; the answer is a letter from A to D, or E when it is in more than one." },
      NO_NEGATIVE, PASS_T, DEVICE_FAQ, JOIN,
    ],
  },
  {
    code: "4c",
    slug: "find-9-test",
    battery: 4,
    name: "Find 9 Test",
    hindi: "9 खोजो परीक्षण",
    title: "RRB ALP Find 9 Test (Power of Observation 4c): pattern, tips",
    description: "Find 9 Test of the RRB ALP psycho test: four groups of digits, which holds a 9? More than one, E. 75 questions, 4 minutes. Example, method, practice papers.",
    keywords: ["find 9 test ALP", "find nine test RRB psycho", "power of observation test find 9", "ALP CBAT 4c", "digit search test railway"],
    what: "Each question has four groups of digits, A, B, C and D. You find the group that contains a 9; if the 9 appears in more than one group, the answer is E. The form is the Find 6 Test's, with 9 as the digit sought.",
    whatHi: "हर प्रश्न में अंकों के चार समूह A, B, C, D हैं। जिस समूह में 9 है वह चुनना है; 9 एक से अधिक समूहों में हो तो उत्तर E।",
    questions: 75,
    questionsNote: "",
    minutes: 4,
    minutesNote: "",
    how: [
      "The instruction screen shows five practice rows with their answers (B, C, A, D, E). Press Skip Instruction to start sooner.",
      "The test screen lists the questions, four lettered groups and then A to E; 25 to a part, Save & Next to the next part.",
      "Scan the four groups for a 9, mark the letter (or E), next.",
      "Submit, or the clock submits for you. Your T-Score appears at once.",
    ],
    example: {
      lines: ["1. A 5462   B 5927   C 4282   D 2821", "2. A 73457   B 24674   C 32985   D 54838", "5. A 89537   B 38567   C 58974   D 28378"],
      answer: "The guideline's answers for its five rows are B, C, A, D and E.",
    },
    tips: [
      { h: "Hunt the shape", p: "A 9 is a loop at the top with a tail going down. Let the eye search for the loop-on-top; that is faster than reading." },
      { h: "Sweep all four before marking", p: "One 9 found is not the answer yet; a second 9 anywhere makes it E." },
      { h: "Keep 9 apart from 6 and 4", p: "A 6 is the 9 upside down; a closed 4 can look like a 9 in small print. The loop's place decides." },
      { h: "Three seconds a question", p: "75 in 4 minutes. One sweep, one mark." },
      DEVICE_TIP,
      { h: "Answer every question", p: "No negative marking." },
    ],
    mistakes: ["Marking the first group with a 9 without sweeping the rest.", "Mistaking a 6 for a 9.", "Re-reading for safety and losing the clock.", "Leaving the last part blank."],
    faq: [
      { q: "How many questions does the Find 9 Test have?", a: "75 in 4 minutes, as the RDSO guideline gives it. The portal builds fresh questions for every paper." },
      { q: "Will the hall give Find 6 or Find 9?", a: "Either. They are two forms of the same question; practise both so the digit's shape is automatic." },
      NO_NEGATIVE, PASS_T, DEVICE_FAQ, JOIN,
    ],
  },
  {
    code: "4d",
    slug: "figure-placement-test",
    battery: 4,
    name: "Figure Placement Test",
    hindi: "आकृति स्थान परीक्षण",
    title: "RRB ALP Figure Placement Test (Power of Observation 4d): pattern, tips",
    description: "Figure Placement Test of the RRB ALP psycho test: set A against set B, none or 2 to 4 figures moved. 60 questions, 7 minutes. Example, counting method, tips.",
    keywords: ["figure placement test ALP", "figure placement test RRB psycho", "set A set B observation test", "ALP CBAT 4d", "power of observation test figures"],
    what: "Two sets of figures, A and B, are shown side by side. You decide whether the placement of every figure in set A is exactly the same as in set B, or how many figures differ: no difference is A, two differences B, three C, four D. There is never one difference and never more than four.",
    whatHi: "आकृतियों के दो सेट A और B आमने-सामने हैं। बताना है कि हर आकृति की जगह दोनों में एक जैसी है या कितनी अलग: कोई अंतर नहीं तो A, दो अंतर B, तीन C, चार D।",
    questions: 60,
    questionsNote: "",
    minutes: 7,
    minutesNote: "",
    how: [
      "The instruction screen shows four example pairs of sets with their answers (A, B, C, D). Press Skip Instruction to start sooner.",
      "The test screen shows each question's picture with 'Set A' and 'Set B' over its two halves and the four radios on the same line; parts move with Save & Next.",
      "Compare the sets figure by figure, count the differences, mark the letter.",
      "Submit, or the clock submits for you. Your T-Score appears at once.",
    ],
    example: {
      lines: ["Problem 1: every figure in the same place in both sets.", "Problem 2: two figures in different places.", "Problems 3 and 4: three and four differences."],
      answer: "So the answers are A, B, C and D.",
    },
    tips: [
      { h: "Compare in position order", p: "First figure of A against first of B, second against second, and so on. Counting differences by position is faster than hunting for what moved." },
      { h: "Use the rule: never one", p: "If you have counted one difference, there is another; look again. The count is 0, 2, 3 or 4." },
      { h: "Stop at four", p: "Four differences is D; a fifth cannot happen. Mark and move." },
      { h: "Seven seconds a question", p: "60 in 7 minutes. One pass by position, one mark." },
      DEVICE_TIP,
      { h: "Answer every question", p: "No negative marking." },
    ],
    mistakes: ["Counting a figure that is the same but drawn slightly differently as a difference.", "Stopping at one difference and marking B.", "Comparing by what the figures are instead of where they are.", "Leaving the last part blank."],
    faq: [
      { q: "How many questions does the Figure Placement Test have?", a: "60 in 7 minutes, as the RDSO guideline gives it. The portal's papers follow the same count and clock." },
      { q: "Can there be one difference?", a: "No. The guideline states there is either no difference, or at least two and at most four." },
      NO_NEGATIVE, PASS_T, DEVICE_FAQ, JOIN,
    ],
  },

  // ──────────────────── Test 5 · Perceptual Speed ────────────────────
  {
    code: "5a",
    slug: "similarity-test",
    battery: 5,
    name: "Similarity Test",
    hindi: "समानता परीक्षण",
    title: "RRB ALP Similarity Test (Perceptual Speed 5a): pattern, example, tips",
    description: "Similarity Test of the RRB ALP psycho test: four figures a to d, each matched against five. 72 questions, 6 minutes, 18 sheets. Worked example, tips, practice.",
    keywords: ["similarity test ALP", "similarity test RRB psycho", "perceptual speed test similarity", "ALP CBAT 5a", "figure matching test railway"],
    what: "A sheet shows four figures, a, b, c and d, at the left; beside each are five figures A to E. For each figure you find the one at the right that is most nearly like it. Eighteen sheets of four make the 72 questions.",
    whatHi: "एक पृष्ठ पर बाईं ओर चार आकृतियाँ a, b, c, d हैं; हर एक के सामने पाँच आकृतियाँ A से E। हर आकृति के लिए वह चुननी है जो उससे सबसे अधिक मिलती है। अठारह पृष्ठ, हर एक में चार प्रश्न।",
    questions: 72,
    questionsNote: "18 sheets × 4",
    minutes: 6,
    minutesNote: "",
    how: [
      "The instruction screen shows an example sheet with its answers. Press Skip Instruction to start sooner.",
      "The test screen shows one sheet at the left and its four questions at the right: 1. a, 2. b, 3. c, 4. d, each with A to E.",
      "Save & Next opens the next sheet; the questions continue 5 to 8, and so on to 72.",
      "Submit, or the clock submits for you. Your T-Score appears at once.",
    ],
    example: {
      lines: ["Look at the first figure 'a' at the left. Which of the five at the right is most nearly like it? Figure D.", "For the second figure 'b', figure C."],
      answer: "In the guideline's example the answers for a, b, c and d are D, C, B and A.",
    },
    tips: [
      { h: "Pick one feature and scan for it", p: "A notch, a dot, a line's angle. Find the one feature that makes the figure itself, then look only for that in the five." },
      { h: "Most nearly like, not identical", p: "The right option may be drawn a little differently. The question asks for the closest, so do not reject a near match while hunting a perfect one." },
      { h: "Five seconds a question", p: "72 in 6 minutes. One feature, one sweep, one mark." },
      { h: "Keep the row", p: "Question 3 is figure c, row three of the sheet. Losing the row loses the answer." },
      DEVICE_TIP,
      { h: "Answer every question", p: "No negative marking." },
    ],
    mistakes: ["Comparing every detail of every option instead of one feature.", "Answering row b's question with row c's figure.", "Rejecting the closest option because it is not identical.", "Leaving sheets blank at the end."],
    faq: [
      { q: "How many questions does the Similarity Test have?", a: "72 in 6 minutes, as 18 sheets of 4, as the RDSO guideline gives it. The portal's papers follow the same pattern." },
      { q: "What is Similarity Test Type-II?", a: "The same test with objects (the guideline's example uses radios) instead of abstract figures. Both are forms of Perceptual Speed (Test 5)." },
      NO_NEGATIVE, PASS_T, DEVICE_FAQ, JOIN,
    ],
  },
  {
    code: "5b",
    slug: "octagonal-test",
    battery: 5,
    name: "Octagonal Test",
    hindi: "अष्टकोण परीक्षण",
    title: "RRB ALP Octagonal Test (Perceptual Speed 5b): pattern, example, tips",
    description: "Octagonal Test of the RRB ALP psycho test: a figure on the left, five on the right, find the identical one. 96 questions, 5 minutes. Example, tips, practice.",
    keywords: ["octagonal test ALP", "octagonal test RRB psycho", "perceptual speed test octagon", "ALP CBAT 5b", "identical figure test railway"],
    what: "A figure is given on the left; on the right are five other figures. You find which of the five is identical to the one on the left. The figures are octagons with a mark inside, and the clock is short: 96 questions in 5 minutes.",
    whatHi: "बाईं ओर एक आकृति दी गई है, दाईं ओर पाँच अन्य। पता करना है कि पाँचों में से कौन सी बाईं आकृति के बिल्कुल समान है। 96 प्रश्न, 5 मिनट।",
    questions: 96,
    questionsNote: "",
    minutes: 5,
    minutesNote: "",
    how: [
      "The instruction screen shows three example rows with their answers (D, A, D). Press Skip Instruction to start sooner.",
      "The test screen shows one row per question: the number, the figure, the five options with A to E beneath, then the radios. Parts move with Save & Next.",
      "Find the identical figure, mark the letter, next.",
      "Submit, or the clock submits for you. Your T-Score appears at once.",
    ],
    example: {
      lines: ["Row 1: an octagon with a hand pointing to about two o'clock; five octagons with hands at different angles.", "Row 2 and row 3 likewise."],
      answer: "In the guideline's example the answers are D, A and D.",
    },
    tips: [
      { h: "Read the mark's direction first", p: "Most options differ only in where the inner mark points. Fix its direction (up, two o'clock, left) and look for that alone." },
      { h: "Identical means identical", p: "Unlike the Similarity Test, here only an exact match is right. A near match is a wrong option placed to catch you." },
      { h: "Three seconds a question", p: "96 in 5 minutes. One look at the figure, one sweep of the five, one mark." },
      { h: "Keep the rhythm", p: "Do not stop to re-check. A steady three seconds beats a careful ten." },
      DEVICE_TIP,
      { h: "Answer every question", p: "No negative marking." },
    ],
    mistakes: ["Accepting a mirror image as identical.", "Re-checking every row and finishing half the paper.", "Marking the row above or below after losing the line.", "Leaving the last part blank."],
    faq: [
      { q: "How many questions does the Octagonal Test have?", a: "96 in 5 minutes, as the RDSO guideline gives it. The portal's papers follow the same count and clock." },
      { q: "Is it the same as the Same Figure Test?", a: "The rule is the same, find the identical figure, but the figures differ: octagons with an inner mark here, mixed figures in the Same Figure Test. Both are forms of Perceptual Speed (Test 5)." },
      NO_NEGATIVE, PASS_T, DEVICE_FAQ, JOIN,
    ],
  },
  {
    code: "5c",
    slug: "similarity-test-type-2",
    battery: 5,
    name: "Similarity Test Type-II",
    hindi: "समानता परीक्षण प्रकार-II",
    title: "RRB ALP Similarity Test Type-II (Perceptual Speed 5c): pattern, tips",
    description: "Similarity Test Type-II of the RRB ALP psycho test: four objects a to d, each matched against five. 72 questions, 6 minutes. Worked example, tips, practice.",
    keywords: ["similarity test type 2 ALP", "similarity test type II RRB psycho", "perceptual speed test objects", "ALP CBAT 5c", "object matching test railway"],
    what: "A sheet shows four objects, a, b, c and d, at the left (the guideline's example uses radios); beside each are five objects A to E. For each you find the one most nearly like it. Eighteen sheets of four make the 72 questions.",
    whatHi: "एक पृष्ठ पर बाईं ओर चार वस्तुएँ a, b, c, d हैं (उदाहरण में रेडियो); हर एक के सामने पाँच वस्तुएँ A से E। हर एक के लिए सबसे अधिक मिलती वस्तु चुननी है। अठारह पृष्ठ, हर एक में चार प्रश्न।",
    questions: 72,
    questionsNote: "18 sheets × 4",
    minutes: 6,
    minutesNote: "",
    how: [
      "The instruction screen shows an example sheet of radios with its answers. Press Skip Instruction to start sooner.",
      "The test screen shows one sheet at the left and its four questions at the right: 1. a, 2. b, 3. c, 4. d, each with A to E.",
      "Save & Next opens the next sheet; the questions continue 5 to 8, and so on to 72.",
      "Submit, or the clock submits for you. Your T-Score appears at once.",
    ],
    example: {
      lines: ["Look at the first radio at the left. Which of the five at the right is most nearly like it? Radio B.", "The second radio: radio C."],
      answer: "In the guideline's example the answers for a, b, c and d are B, C, A and D.",
    },
    tips: [
      { h: "Pick the object's one odd detail", p: "A dial's place, an aerial's angle, a knob missing. One detail, found in the five, is the answer." },
      { h: "Most nearly like", p: "The closest, not the identical. Do not hunt for a perfect copy." },
      { h: "Five seconds a question", p: "72 in 6 minutes. One detail, one sweep, one mark." },
      { h: "Keep the row", p: "Question 2 is object b, the second row. Losing the row loses the mark." },
      DEVICE_TIP,
      { h: "Answer every question", p: "No negative marking." },
    ],
    mistakes: ["Comparing whole objects instead of one detail.", "Answering with the row above or below.", "Rejecting the closest option for not being identical.", "Leaving sheets blank."],
    faq: [
      { q: "How many questions does the Similarity Test Type-II have?", a: "72 in 6 minutes, as 18 sheets of 4, as the RDSO guideline gives it. The portal's papers follow the same pattern." },
      { q: "How is it different from the Similarity Test?", a: "Only in what is drawn: everyday objects instead of abstract figures. The rule, the sheet and the timing are the same." },
      NO_NEGATIVE, PASS_T, DEVICE_FAQ, JOIN,
    ],
  },
  {
    code: "5d",
    slug: "same-circle-test",
    battery: 5,
    name: "Same Circle Test",
    hindi: "समान वृत्त परीक्षण",
    title: "RRB ALP Same Circle Test (Perceptual Speed 5d): pattern, example, tips",
    description: "Same Circle Test of the RRB ALP psycho test: a circle figure and A to E, find the exactly similar one. 60 questions, 8 minutes. Example, tips, practice papers.",
    keywords: ["same circle test ALP", "same circle test RRB psycho", "perceptual speed test circle", "ALP CBAT 5d", "circle matching test railway"],
    what: "A circle figure is given at the left, with arrows or marks around it, followed by figures A, B, C, D and E on the right. You find which of the five is exactly similar to the one on the left. 60 questions in 8 minutes.",
    whatHi: "बाईं ओर एक वृत्त आकृति है, उसके चारों ओर तीर या चिह्न; दाईं ओर A से E आकृतियाँ। पता करना है कि कौन सी बाईं आकृति से पूर्णतया मिलती है। 60 प्रश्न, 8 मिनट।",
    questions: 60,
    questionsNote: "",
    minutes: 8,
    minutesNote: "",
    how: [
      "The instruction screen shows two example rows with their answers (C, B). Press Skip Instruction to start sooner.",
      "The test screen shows one row per question: the number, the circle, the five options with A to E beneath, then the radios. Parts move with Save & Next.",
      "Find the exactly similar circle, mark the letter, next.",
      "Submit, or the clock submits for you. Your T-Score appears at once.",
    ],
    example: {
      lines: ["Row 1: a circle with arrows around it; five circles whose arrows point differently.", "Row 2 likewise."],
      answer: "In the guideline's example the answers are C and B.",
    },
    tips: [
      { h: "Count the arrows and their turn", p: "How many arrows, and do they turn clockwise or anticlockwise? Those two facts rule out most options at once." },
      { h: "Then check one arrow's place", p: "Among the options that survive, one arrow's position decides. Pick the arrow at the top and compare it alone." },
      { h: "Eight seconds a question", p: "60 in 8 minutes: more time than the Octagonal Test, but the figures are finer. Use it, do not waste it." },
      { h: "Exactly similar", p: "Only the exact match is right; a mirror image or a rotation is a wrong option." },
      DEVICE_TIP,
      { h: "Answer every question", p: "No negative marking." },
    ],
    mistakes: ["Accepting a rotated or mirrored circle.", "Comparing all five arrows of all five options.", "Losing the row after a scroll.", "Leaving the last part blank."],
    faq: [
      { q: "How many questions does the Same Circle Test have?", a: "60 in 8 minutes, as the RDSO guideline gives it. The portal's papers follow the same count and clock." },
      { q: "How is it different from the Octagonal Test?", a: "The rule is the same, find the identical figure; the figures are circles with arrows here and octagons with an inner mark there, and the clock is longer here." },
      NO_NEGATIVE, PASS_T, DEVICE_FAQ, JOIN,
    ],
  },
  {
    code: "5e",
    slug: "same-figure-test",
    battery: 5,
    name: "Same Figure Test",
    hindi: "समान आकृति परीक्षण",
    title: "RRB ALP Same Figure Test (Perceptual Speed 5e): pattern, example, tips",
    description: "Same Figure Test of the RRB ALP psycho test: a figure and five options, find the identical one. 72 questions, 8 minutes. Example, how to match fast, practice.",
    keywords: ["same figure test ALP", "same figure test RRB psycho", "perceptual speed test same figure", "ALP CBAT 5e", "identical figure test"],
    what: "A figure is given, below or beside which are five figures A to E. You find which of the five is identical to the given figure. It is the Perceptual Speed Test most students meet first on the portal: 72 questions in 8 minutes.",
    whatHi: "एक आकृति दी गई है, जिसके साथ पाँच आकृतियाँ A से E हैं। पता करना है कि कौन सी दी गई आकृति के समान है। 72 प्रश्न, 8 मिनट।",
    questions: 72,
    questionsNote: "",
    minutes: 8,
    minutesNote: "",
    how: [
      "The instruction screen shows example rows with their answers. Press Skip Instruction to start sooner.",
      "The test screen shows each question's figure with its five option pictures and A to E; ten questions to a part, Save & Next to the next part.",
      "Find the identical figure, mark the letter, next.",
      "Submit, or the clock submits for you. Your T-Score appears at once.",
    ],
    example: {
      lines: ["Example 1: the given figure and five options, one identical.", "Examples 2 and 3 likewise."],
      answer: "In the guideline's example the answers are A, B and D.",
    },
    tips: [
      { h: "Fix one feature", p: "A dot's corner, a cross's side. Find the feature that makes the figure itself and look for that alone." },
      { h: "Identical, not similar", p: "A mirror image or a figure with the dot moved is a wrong option placed to catch you." },
      { h: "Six seconds a question", p: "72 in 8 minutes. One feature, one sweep, one mark." },
      { h: "Keep the rhythm", p: "A steady pace through all 72 beats a careful first half and a blank second half." },
      DEVICE_TIP,
      { h: "Answer every question", p: "No negative marking." },
    ],
    mistakes: ["Accepting a mirror image.", "Re-checking every question.", "Losing the row after scrolling.", "Leaving the last part blank."],
    faq: [
      { q: "How many questions does the Same Figure Test have?", a: "72 in 8 minutes, as the RDSO guideline gives it. The portal's papers follow the same count and clock." },
      { q: "Which Perceptual Speed test will the hall give?", a: "Any of the five: Similarity, Octagonal, Similarity Type-II, Same Circle or Same Figure. The portal has papers for all five." },
      NO_NEGATIVE, PASS_T, DEVICE_FAQ, JOIN,
    ],
  },
];

export function sectionPage(batterySlug: string, slug: string): SectionPage | undefined {
  const battery = TEST_PAGES.find((t) => t.slug === batterySlug)?.battery;
  if (!battery) return undefined;
  return SECTION_PAGES.find((s) => s.battery === battery && s.slug === slug);
}

export function sectionsOfBattery(battery: number): SectionPage[] {
  return SECTION_PAGES.filter((s) => s.battery === battery);
}

/** The battery page a section sits under. */
export function batteryPageOf(s: SectionPage) {
  return TEST_PAGES.find((t) => t.battery === s.battery)!;
}

export function sectionUrl(s: SectionPage): string {
  return `/psycho-test/${batteryPageOf(s).slug}/${s.slug}`;
}
