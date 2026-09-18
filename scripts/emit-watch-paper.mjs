/**
 * Compiles the TypeScript generator to a temp dir, runs it, and writes the
 * bundled sample paper to data/watch-table-1.json.
 *
 *   node scripts/emit-watch-paper.mjs
 *
 * Kept separate from the app so the paper is a reviewable artefact in git
 * rather than something regenerated invisibly at build time.
 */
import { execSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const out = mkdtempSync(join(tmpdir(), "wt-"));

// CommonJS, because the emitted relative imports carry no .js extension and
// Node's ESM resolver requires one. tsc flattens to the out dir root.
execSync(
  `npx tsc lib/wt/generate.ts lib/wt/engine.ts lib/wt/types.ts ` +
    `--outDir ${out} --module commonjs --target ES2022 --skipLibCheck`,
  { cwd: root, stdio: "inherit" },
);

const require = createRequire(import.meta.url);
const { generateQuestions } = require(join(out, "generate.js"));

const SEED = 20260918;
// One diagram for the whole paper: the left panel must not change under the
// candidate as they move down the questions.
const { tables, questions } = generateQuestions({ seed: SEED, count: 20, tableCount: 1 });

const bi = (en, hi) => ({ en, hi });

const paper = {
  id: "watch-table-1",
  title: "Watch Table Test",
  displayName: "Watch Table Test - 1 (Easy Level)",
  timeLimitMin: 10,
  instructionTimeLimitMin: 5,
  seed: SEED,
  instructions: [
    bi(
      "This is a test of your ability to follow a set of given directions. In this test some English letters are given in a circle along with some numbers written inside squares. Centre of the circle gives indication about direction. You will be asked questions based on this complete pattern. The answer will be a number given inside the square.",
      "यह परीक्षण दिए गए निर्देशों को समझने की योग्यता का परीक्षण है। इस परीक्षण में एक गोले में अंग्रेजी के कुछ अक्षर दिए गए हैं जिसके साथ वर्ग में कुछ संख्याएँ लिखी गयी हैं। गोले के केंद्र से दिशाओं की सूचना मिलती है। आपसे इनपर आधारित प्रश्न पूछे जायेंगे। प्रश्न का उत्तर वर्ग में दी गयी कोई संख्या होगी।",
    ),
    bi(
      "Travelling right-handedly means moving clockwise around the circle; left-handedly means anticlockwise. The path includes both the starting and the ending position.",
      "दाएं हाथ से जाने का अर्थ है गोले में दक्षिणावर्त (घड़ी की दिशा में) चलना; बाएं हाथ से का अर्थ है वामावर्त। पथ में प्रारंभिक तथा अंतिम दोनों स्थान सम्मिलित होते हैं।",
    ),
    bi(
      "You have 5 minutes to read these instructions. When that time is over the test begins by itself, and its own 10 minute clock starts. Press Skip Instruction to begin sooner.",
      "इन निर्देशों को पढ़ने के लिए आपके पास 5 मिनट हैं। यह समय समाप्त होते ही परीक्षण स्वतः प्रारंभ हो जाएगा और उसका अपना 10 मिनट का समय शुरू होगा। जल्दी शुरू करने के लिए Skip Instruction दबाएँ।",
    ),
  ],
  example: {
    table: tables[0],
    text: [
      bi(
        "Now look at the example given below. The letters sit on the circle and the compass at the centre tells you which position is North, East, South and West.",
        "अब नीचे दिए गए उदाहरण को देखें। अक्षर गोले पर स्थित हैं और केंद्र का दिशा-सूचक बताता है कि कौन सा स्थान उत्तर, पूर्व, दक्षिण और पश्चिम है।",
      ),
    ],
  },
  tables,
  questions,
};

mkdirSync(join(root, "data"), { recursive: true });
writeFileSync(
  join(root, "data", "watch-table-1.json"),
  `${JSON.stringify(paper, null, 2)}\n`,
  "utf8",
);

console.log(
  `wrote data/watch-table-1.json — ${tables.length} diagrams, ${questions.length} questions`,
);
