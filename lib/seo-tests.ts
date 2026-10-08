/**
 * The public pages for the five tests and the ALP exam: what each test
 * asks, how it is timed on the portal's own Full Mock papers, tips, and
 * the questions students ask. Plain data; the pages draw it.
 */
export interface TestPage {
  slug: string;
  battery: number;
  name: string;
  hindi: string;
  /** The search title; under 60 characters where possible. */
  title: string;
  description: string;
  keywords: string[];
  /** What the test asks, in two or three sentences. */
  what: string;
  whatHi: string;
  /** The portal's own paper: questions and minutes, as the Full Mock runs it. */
  questions: number;
  minutes: number;
  /** How the screen works, step by step. */
  how: string[];
  tips: { h: string; p: string }[];
  mistakes: string[];
  faq: { q: string; a: string }[];
  /** The portal screenshot to show, under /landing. */
  image: string | null;
  /** Which demo on /demo fits this test, if any. */
  demo: "memory" | "speed" | null;
}

export const TEST_PAGES: TestPage[] = [
  {
    slug: "memory-test",
    battery: 1,
    name: "Memory Test",
    hindi: "स्मृति परीक्षण",
    title: "RRB ALP Memory Test (Psycho Test 1): pattern, tips, sample",
    description: "The Memory Test of the RRB ALP CBAT: what is shown, how long you get, how it is scored, 6 tips to remember more, and a two-minute sample on a screen like the exam hall.",
    keywords: ["ALP memory test", "RRB ALP psycho test memory", "memory test CBAT", "smriti parikshan ALP"],
    what: "A set of pictures (or a grid of objects) is shown on screen for a fixed time, then hidden. The questions ask which pictures were there, where they were, or what has changed. It is Test 1 of the five, the first thing you meet after the instructions.",
    whatHi: "कुछ चित्र तय समय के लिए दिखाए जाते हैं, फिर छिपा दिए जाते हैं। सवाल पूछते हैं कि कौन से चित्र थे, कहाँ थे।",
    questions: 24,
    minutes: 10,
    how: [
      "The instruction screen (5 minutes, Hindi and English) explains the test with an example. Press Skip Instruction to start sooner.",
      "The study picture appears for a fixed time with its own clock. Look, group, repeat; nothing can be written.",
      "The picture disappears and the questions start, in two parts. Each question shows five options (A to E); choose the one that was in the picture, or the one that was not.",
      "Submit, or the clock submits for you. Your T-Score appears at once on the portal.",
    ],
    tips: [
      { h: "Group the pictures", p: "Twelve things are hard to hold; four groups of three are not. Pair pictures by kind (animals, tools, vehicles) or by a story that links them." },
      { h: "Read the grid in one fixed order", p: "Left to right, top to bottom, every time. Position questions then come free: you remember the order, not twelve separate places." },
      { h: "Say the names, silently", p: "Naming each picture as you look fixes it twice: once as an image, once as a word. Students who only look forget the corners first." },
      { h: "Use the whole study time", p: "The clock is for you. Students who feel ready at 30 seconds and look away lose the last review pass, which is where the weak items get fixed." },
      { h: "Answer every question", p: "There is no negative marking in the CBAT. An unanswered question is a mark lost for certain; a guess is a mark lost maybe." },
      { h: "Practise with different sets daily", p: "Memory is a skill that grows with repetition. Ten minutes a day on new sets does more than an hour once a week on the same set." },
    ],
    mistakes: ["Trying to memorise the pictures one by one, with no grouping.", "Looking at the picture without reading it in a fixed order, then failing the position questions.", "Leaving questions blank in Part 2 because Part 1 felt bad.", "Practising with the same set so often that it is recognised, not remembered."],
    faq: [
      { q: "How many questions are in the ALP Memory Test?", a: "On the portal's Full Mock, the Memory Test has 24 questions in two parts, after a timed study picture. The real CBAT follows the RDSO pattern; the counts and timing on the portal are set to match it, and the institute updates them if the pattern changes." },
      { q: "Is there negative marking?", a: "No. Attempt every question." },
      { q: "What T-Score do I need in the Memory Test?", a: "At least 42, like every other test of the CBAT. The portal shows your T-Score the moment you submit." },
      { q: "Can I try the Memory Test free?", a: "The two-minute sample on this site has a short memory test with no login. Full papers of every test, and the Full Mocks, come with a Kautilya Classes package: message the team on WhatsApp to join." },
    ],
    image: "/landing/exam.jpg",
    demo: "memory",
  },
  {
    slug: "following-directions-test",
    battery: 2,
    name: "Following Directions Test",
    hindi: "निर्देश पालन परीक्षण",
    title: "RRB ALP Following Directions Test (Psycho Test 2): pattern & tips",
    description: "The Following Directions Test of the RRB ALP CBAT: the Watch Table, Letter Table and Number Table, how the questions are worded, the 5 rules to solve them fast, and practice papers.",
    keywords: ["following directions test ALP", "watch table test RRB", "letter table test", "number table test psycho", "nirdesh palan parikshan"],
    what: "A table or a circle of letters and numbers with a compass at the centre, and a sentence of directions: start here, go two steps north, take the letter to the left of it. You follow the directions exactly and mark the number or letter you land on. The Watch Table, Letter Table and Number Table are the three forms of this test.",
    whatHi: "अक्षरों और संख्याओं की तालिका या गोला, बीच में दिशा सूचक। एक वाक्य में निर्देश दिए जाते हैं; उन्हें ठीक-ठीक मानकर सही अक्षर या संख्या चुननी होती है।",
    questions: 20,
    minutes: 10,
    how: [
      "The instruction screen explains the table, the compass and a worked example, in Hindi and English.",
      "Every question is one sentence of directions about the table on screen. Read it once, slowly; the words 'left of', 'opposite', 'between' are where marks are lost.",
      "Mark the answer among the options and press Save & Next. The table stays on screen for every question.",
      "Submit, or the clock submits for you.",
    ],
    tips: [
      { h: "Learn the compass before the test", p: "North is up, East is right, and every question assumes you know it without thinking. Students who pause at 'south-west' lose two seconds on every question." },
      { h: "Read the whole sentence first", p: "Directions often have a twist at the end ('…and then the number opposite it'). Start moving only after the full sentence is read." },
      { h: "Put a finger on the screen, mentally", p: "Track the position step by step, saying each step. Jumping two steps at once is where the wrong letter comes from." },
      { h: "Know the three tables cold", p: "Watch Table (circle with letters and boxed numbers), Letter Table, Number Table. Each has its own common question types; practise each form separately until the wording feels familiar." },
      { h: "Keep a pace", p: "Twenty questions in ten minutes is thirty seconds each. If a question passes forty seconds, mark your best answer and move on; come back if time is left." },
    ],
    mistakes: ["Mixing up left and right when facing a direction other than north.", "Taking 'alphabetically first' as 'first in the table'.", "Starting to move before the sentence ends.", "Spending two minutes on one question and leaving five blank."],
    faq: [
      { q: "What are the Watch Table, Letter Table and Number Table?", a: "Three forms of the same test. The Watch Table is a circle with letters and boxed numbers around a compass; the Letter Table and Number Table are grids. The portal has separate practice series for all three." },
      { q: "How many questions and how much time?", a: "On the portal's Full Mock, 20 questions in 10 minutes, after a 5-minute instruction screen. Set to the RDSO pattern; updated by the institute if the pattern changes." },
      { q: "Is the test in Hindi?", a: "Every question and every instruction is shown in Hindi and English together, on the real exam and on the portal." },
    ],
    image: "/landing/exam.jpg",
    demo: null,
  },
  {
    slug: "depth-perception-test",
    battery: 3,
    name: "Depth Perception Test",
    hindi: "गहराई बोध परीक्षण",
    title: "RRB ALP Depth Perception Test (Psycho Test 3): cube counting tips",
    description: "The Depth Perception Test of the RRB ALP CBAT: how the stacked cube figures work, how to count the hidden cubes layer by layer without mistakes, the pattern and timing, and practice papers.",
    keywords: ["depth perception test ALP", "cube counting psycho test", "hidden cube test RRB", "gahrai bodh parikshan"],
    what: "A figure made of stacked cubes is shown; you count how many cubes it holds, including the ones hidden behind or beneath the visible ones. Every cube that is seen must rest on something, so the hidden ones can be worked out. Test 3 of the five.",
    whatHi: "घनों से बनी आकृति दिखाई जाती है; आपको गिनना है कि उसमें कुल कितने घन हैं, छिपे हुए घन मिलाकर।",
    questions: 50,
    minutes: 10,
    how: [
      "The instruction screen shows how a figure is built and how the hidden cubes are counted, with a worked example.",
      "Each question is one figure (or a group of figures) with a question like 'How many cubes are in the figure?' and five options.",
      "The figure stays on screen; count, mark, Save & Next.",
      "Fifty questions in ten minutes: twelve seconds each. Speed comes from a fixed method, not from staring.",
    ],
    tips: [
      { h: "Count by layers, bottom up", p: "Decide the base layer first (every cube above needs one below it), then the next layer, then the top. Add the layers. This one habit removes most mistakes." },
      { h: "Count columns, not cubes", p: "For each column standing on the base, count its height. The figure is a set of towers; add the heights. A column you cannot see is as tall as what it supports." },
      { h: "Trust the rule, not the picture", p: "A cube that is seen floating must be resting on hidden cubes. Add them even though the picture does not show them; that is the whole test." },
      { h: "Practise the standard shapes", p: "L-shapes, steps and pyramids come again and again. After fifty papers, most figures are recognised at a glance." },
      { h: "Keep moving", p: "Twelve seconds per question. A figure that takes thirty seconds is costing you two questions elsewhere; mark the best count and move on." },
    ],
    mistakes: ["Counting only the visible cubes.", "Counting a hidden cube twice because two visible cubes rest on it.", "Changing the counting method from figure to figure.", "Losing the count halfway and starting again instead of marking the best guess."],
    faq: [
      { q: "How are the hidden cubes decided?", a: "Every visible cube must be supported from below. If a cube is seen at the second level, there is a cube under it, seen or not. Count the base that must exist, then the layers above." },
      { q: "How many questions are there?", a: "On the portal's Full Mock, 50 questions in 10 minutes, set to the RDSO pattern." },
      { q: "Does the portal show the solution?", a: "Yes: after submitting, every question can be reviewed with the correct count, and a question with a doubt can be reported to the institute from the review screen." },
    ],
    image: null,
    demo: null,
  },
  {
    slug: "power-of-observation-test",
    battery: 4,
    name: "Power of Observation Test",
    hindi: "अवलोकन शक्ति परीक्षण",
    title: "RRB ALP Power of Observation Test (Psycho Test 4): pattern & tips",
    description: "The Power of Observation Test of the RRB ALP CBAT: how the figure placement and spot-the-difference questions work, the timing, five tips to see faster, and practice papers.",
    keywords: ["power of observation test ALP", "observation test psycho RRB", "figure placement test", "avlokan shakti parikshan"],
    what: "A reference picture or figure is kept on screen; each question asks where a figure is placed, which detail has changed, or which option matches the reference. It tests how carefully and quickly you look. Test 4 of the five.",
    whatHi: "एक संदर्भ चित्र स्क्रीन पर रहता है; सवाल पूछते हैं कि कोई आकृति कहाँ रखी है, क्या बदला है, या कौन सा विकल्प संदर्भ से मेल खाता है।",
    questions: 60,
    minutes: 10,
    how: [
      "The instruction screen explains the reference picture and the question types with an example.",
      "The reference stays on screen beside the questions; each question shows options A to E.",
      "Compare, mark, Save & Next. Sixty questions in ten minutes: ten seconds each.",
      "Submit, or the clock does.",
    ],
    tips: [
      { h: "Look at the reference once, properly", p: "Thirty seconds spent learning the reference picture (what is where, what is unusual) saves time on every one of the sixty questions." },
      { h: "Compare one feature at a time", p: "Shape first, then orientation, then the small mark. Options that fail the first check are gone without looking further." },
      { h: "Eliminate, do not confirm", p: "It is faster to throw out the four wrong options than to prove the right one. Each option usually differs from the reference in one obvious way." },
      { h: "Keep the eyes moving", p: "Staring at one option makes every option look the same. Scan all five, then decide." },
      { h: "Practise on a laptop", p: "The real screen is a monitor, not a phone. Figures look different at size; practise the way you will be tested." },
    ],
    mistakes: ["Answering from memory of the reference instead of looking at it.", "Confusing a mirrored figure with a rotated one.", "Reading the question too fast and answering 'which is same' as 'which is different'.", "Slowing down after a few hard questions; the clock does not."],
    faq: [
      { q: "What kinds of questions come in this test?", a: "Mainly two: where a figure is placed in a reference picture (figure placement), and which option differs from or matches the reference (spot the difference). The portal has a practice series for each." },
      { q: "How many questions and how much time?", a: "On the portal's Full Mock, 60 questions in 10 minutes, set to the RDSO pattern." },
      { q: "Is the test in Hindi?", a: "Instructions and questions are in Hindi and English together." },
    ],
    image: null,
    demo: null,
  },
  {
    slug: "perceptual-speed-test",
    battery: 5,
    name: "Perceptual Speed Test",
    hindi: "प्रत्यक्ष गति परीक्षण",
    title: "RRB ALP Perceptual Speed Test (Psycho Test 5): pattern, tips, sample",
    description: "The Perceptual Speed Test of the RRB ALP CBAT: match the identical figure among five, fast. The pattern and timing, six tips for speed without mistakes, and a two-minute sample on a screen like the exam hall.",
    keywords: ["perceptual speed test ALP", "same figure test RRB", "psycho test speed ALP", "pratyaksh gati parikshan"],
    what: "A figure is given; below it are five figures, one of which is identical to it. You find the identical one, question after question, against a short clock. It is the last of the five tests and the fastest.",
    whatHi: "एक आकृति दी जाती है, नीचे पाँच आकृतियाँ, जिनमें एक बिल्कुल वैसी है। उसे जल्दी से पहचानना है।",
    questions: 72,
    minutes: 8,
    how: [
      "The instruction screen explains 'identical' with examples: same shape, same orientation, same marks.",
      "Each question: one figure above, five below, options A to E. Mark the identical one.",
      "Seventy-two questions in eight minutes: under seven seconds each. There is no time to think; there is time to look.",
      "Submit, or the clock does.",
    ],
    tips: [
      { h: "Find the odd detail first", p: "Every figure has one feature that the four wrong options get wrong: a dot, a flipped corner, a missing line. Find that feature in the given figure, then scan the five for it." },
      { h: "Do not re-check", p: "Once an option matches on the deciding feature, mark it and move. Re-checking costs a question." },
      { h: "Use the keyboard", p: "On the portal the options take a key press; a mouse trip per question is a second lost seventy-two times." },
      { h: "Practise in short bursts", p: "Two minutes at full speed, rest, again. Speed is trained like a sprint, not a marathon." },
      { h: "Mind the mirror", p: "A mirror image is the most common wrong option. If the figure has a left-right asymmetry, check that first." },
      { h: "Keep calm at the end", p: "It is the fifth test; you are tired. The last twenty questions are where careless errors cluster. Breathe once, keep the method." },
    ],
    mistakes: ["Looking at the whole figure instead of the deciding detail.", "Taking a mirror image as identical.", "Re-checking a marked answer.", "Skipping questions that look hard; they are all the same difficulty."],
    faq: [
      { q: "How fast do I need to be?", a: "On the portal's Full Mock, 72 questions in 8 minutes: about 6.5 seconds per question. Most students reach that pace within two weeks of daily practice." },
      { q: "Is there negative marking?", a: "No. Attempt every question." },
      { q: "Can I try it free?", a: "The two-minute sample on this site has a short perceptual speed test with no login. The full 72-question paper, and the Full Mocks, come with a Kautilya Classes package: message the team on WhatsApp to join." },
    ],
    image: null,
    demo: "speed",
  },
];

export function testPage(slug: string): TestPage | undefined {
  return TEST_PAGES.find((t) => t.slug === slug);
}
