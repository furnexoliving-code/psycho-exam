#!/usr/bin/env node
/**
 * End-to-end smoke test for the exam portal.
 *
 * Drives a real browser through the whole paper and checks the behaviour that
 * matters: timers tick, the study page flips to the test page, the palette
 * tracks answer state, answers survive a reload, pause freezes the clock, and
 * the result excludes the unkeyed personality test.
 *
 *   npm run build && npm run start     # in one terminal
 *   npm run test:e2e                   # in another
 *
 * BASE_URL    point at a different host/port than http://localhost:3000
 * CHROMIUM_PATH  use an existing Chrome/Chromium instead of Playwright's own
 */
const path = require("path");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const TEST_ID = "alp-psycho-1";
const paper = require(path.join(__dirname, "..", "data", "tests", `${TEST_ID}.json`));

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  console.error(
    "playwright is not installed. Run:\n" +
      "  npm install -D playwright && npx playwright install chromium",
  );
  process.exit(2);
}

let passed = 0;
let failed = 0;

function check(ok, label, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${label}${detail ? `  (${detail})` : ""}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}${detail ? `  (${detail})` : ""}`);
  }
}

function step(n, title) {
  console.log(`\n[${n}] ${title}`);
}

async function main() {
  // CHROMIUM_PATH lets the test reuse a browser that is already on the machine,
  // for CI images and sandboxes where `npx playwright install` is not wanted.
  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  );
  const page = await browser.newPage({ viewport: { width: 1500, height: 900 } });

  const problems = [];
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") problems.push(`console: ${m.text()}`);
  });

  const timer = () => page.locator("[role=timer]").innerText();
  const paletteCount = (rgb) =>
    page
      .locator(".palette-btn")
      .evaluateAll(
        (els, colour) =>
          els.filter((e) => getComputedStyle(e).backgroundColor === colour).length,
        rgb,
      );

  step(1, "Landing page redirects into the instructions");
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  check(page.url().endsWith(`/exam/${TEST_ID}/instructions`), "/ redirects", page.url());
  check(
    (await page.locator("h1").innerText()).includes("General Instructions"),
    "instructions page renders",
  );
  const rows = await page.locator("tbody tr").count();
  check(rows === paper.sections.length, "paper summary lists every test", `${rows} rows`);

  step(2, "Starting the test opens the first section brief");
  await page.getByRole("button", { name: "Start Test" }).click();
  await page.waitForURL(`**/exam/${TEST_ID}`);
  await page.waitForTimeout(600);
  const firstSection = paper.sections[0];
  check(
    (await page.locator("h2").first().innerText()).includes(firstSection.name.en),
    "first section brief shown",
    firstSection.name.en,
  );
  check(
    (await timer()).includes(`00:${String(firstSection.timeLimitMin).padStart(2, "0")}:00`),
    "clock shows the full section time before starting",
    await timer(),
  );

  step(3, "The section clock starts counting down");
  await page.getByRole("button", { name: /Begin Section/ }).click();
  await page.waitForTimeout(1200);
  const t1 = await timer();
  await page.waitForTimeout(2400);
  const t2 = await timer();
  check(t1 !== t2, "timer ticks once the section begins", `${t1} -> ${t2}`);

  step(4, "Study page flips to the relabelled test page");
  check(t1.includes("Study Time Left"), "memory test opens on the study page");
  await page.getByRole("button", { name: /memorised/ }).click();
  await page.waitForTimeout(600);
  check(
    (await timer()).includes("Time Left") && !(await timer()).includes("Study"),
    "section clock takes over after the study page",
    await timer(),
  );
  check(
    (await page.locator(".palette-btn").count()) === firstSection.questions.length,
    "palette has one cell per question",
    `${await page.locator(".palette-btn").count()} cells`,
  );

  step(5, "Answering a question updates the palette");
  const block1 = firstSection.questions.filter((q) => q.blockId === firstSection.blocks[0].id);
  await page.locator(`#${block1[0].id}-${block1[0].correct}`).check();
  await page.waitForTimeout(250);
  check((await paletteCount("rgb(76, 175, 80)")) === 1, "answered question turns green");
  check(
    (await paletteCount("rgb(232, 69, 60)")) === block1.length - 1,
    "visited but unanswered turn red",
  );

  step(6, "Answers survive a page reload");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  check(
    await page.locator(`#${block1[0].id}-${block1[0].correct}`).isChecked(),
    "selected answer restored after refresh",
  );

  step(7, "Pause freezes the clock");
  await page.getByRole("button", { name: /Pause/ }).click();
  await page.waitForTimeout(400);
  const p1 = await timer();
  await page.waitForTimeout(2600);
  check((await timer()) === p1, "clock frozen while paused", p1);
  await page.getByRole("button", { name: "Resume test" }).click();
  await page.waitForTimeout(2300);
  check((await timer()) !== p1, "clock resumes after unpausing", await timer());

  step(8, "Screen zoom scales the exam body");
  const fontSize = () =>
    page.locator(".exam-scale").evaluate((e) => getComputedStyle(e).fontSize);
  const z0 = await fontSize();
  await page.getByRole("button", { name: "Increase text size" }).click();
  await page.waitForTimeout(250);
  const z1 = await fontSize();
  check(z0 !== z1, "A+ enlarges the exam body", `${z0} -> ${z1}`);
  await page.getByRole("button", { name: "Decrease text size" }).click();

  step(9, "Switching section asks for confirmation");
  await page.getByRole("button", { name: new RegExp(`^${paper.sections[1].name.en}`) }).click();
  await page.waitForTimeout(350);
  const dialog = await page.getByRole("dialog").innerText();
  check(/skip this/i.test(dialog), "skip confirmation appears");
  await page.getByRole("button", { name: "No" }).click();
  await page.waitForTimeout(300);
  check(
    (await page.getByRole("dialog").count()) === 0,
    "answering No keeps you in the section",
  );

  step(10, "Completing every section and submitting");
  // One question is left deliberately wrong so the score has to discriminate.
  const wrongKey = ["A", "B", "C", "D", "E"].find((k) => k !== block1[0].correct);
  await page.locator(`#${block1[0].id}-${wrongKey}`).check();

  let expectedCorrect = 0;
  for (const section of paper.sections) {
    if (section.id !== firstSection.id) {
      await page.getByRole("button", { name: new RegExp(`^${section.name.en}`) }).click();
      await page.waitForTimeout(250);
      await page.getByRole("button", { name: "Yes" }).click();
      await page.waitForTimeout(400);
      await page.getByRole("button", { name: /Begin Section/ }).click().catch(() => {});
      await page.waitForTimeout(300);
    }
    for (let b = 0; b < section.blocks.length; b++) {
      for (const q of section.questions.filter((x) => x.blockId === section.blocks[b].id)) {
        if (q.id === block1[0].id) continue; // keep the deliberate mistake
        await page.locator(`#${q.id}-${q.correct ?? "B"}`).check();
        if (section.scored && q.correct) expectedCorrect += 1;
      }
      if (b < section.blocks.length - 1) {
        await page.getByRole("button", { name: /Save & Next/ }).click();
        await page.waitForTimeout(40);
      }
    }
  }

  await page.getByRole("button", { name: /Submit Test/ }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Yes" }).click();
  await page.waitForURL("**/result");
  await page.waitForTimeout(900);

  const scoredTotal = paper.sections
    .filter((s) => s.scored)
    .reduce((n, s) => n + s.questions.length, 0);
  const allTotal = paper.sections.reduce((n, s) => n + s.questions.length, 0);
  const summary = (await page.locator("main").innerText()).replace(/\s+/g, " ");

  check(
    summary.includes(`${expectedCorrect} / ${scoredTotal}`),
    "score counts the one wrong answer",
    `expected ${expectedCorrect} / ${scoredTotal}`,
  );
  check(summary.includes(`${allTotal} / ${allTotal}`), "every question recorded as attempted");
  check(/NOT SCORED/i.test(summary), "personality test marked as not scored");

  step(11, "No browser errors along the way");
  check(problems.length === 0, "clean console", problems.join(" | ") || "none");

  await browser.close();

  console.log(`\n${failed === 0 ? "ALL GOOD" : "FAILURES"}: ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(`\nThe run stopped early: ${err.message}`);
  console.error("Is the server running? Start it with `npm run build && npm run start`.");
  process.exit(1);
});
