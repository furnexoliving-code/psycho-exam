/**
 * Checks the T-score maths against values worked out by hand.
 *
 *   node scripts/verify-tscore.mjs
 */
import { execSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const out = mkdtempSync(join(tmpdir(), "ts-"));

execSync(`npx tsc lib/wt/tscore.ts --outDir ${out} --module commonjs --target ES2022 --skipLibCheck`, {
  cwd: root,
  stdio: "inherit",
});

const require = createRequire(import.meta.url);
const { meanAndSd, tScore } = require(join(out, "tscore.js"));

let failed = 0;
const check = (ok, label, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
  if (!ok) failed += 1;
};
const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

// Population standard deviation of 2,4,4,4,5,5,7,9 is exactly 2, mean 5.
{
  const { mean, sd } = meanAndSd([2, 4, 4, 4, 5, 5, 7, 9]);
  check(near(mean, 5), "mean of the textbook set is 5", String(mean));
  check(near(sd, 2), "population sd of the textbook set is 2", String(sd));
}

// A candidate exactly on the mean scores 50.
{
  const t = tScore(5, { count: 8, mean: 5, sd: 2, source: "cohort" });
  check(near(t.value, 50), "on the mean gives T = 50", String(t.value));
}

// One standard deviation above is 60; two below is 30.
{
  const cohort = { count: 8, mean: 5, sd: 2, source: "cohort" };
  check(near(tScore(7, cohort).value, 60), "one sd above gives 60");
  check(near(tScore(1, cohort).value, 30), "two sd below gives 30");
}

// The user's own formula, spelled out: 50 + 10 * ((14 - 11.5) / 3.2)
{
  const t = tScore(14, { count: 40, mean: 11.5, sd: 3.2, source: "cohort" });
  const expected = 50 + 10 * ((14 - 11.5) / 3.2);
  check(near(t.value, expected), "matches the stated formula", `${t.value.toFixed(4)} vs ${expected.toFixed(4)}`);
}

// Everyone identical: sd is 0, which would divide by zero.
{
  const t = tScore(12, { count: 6, mean: 12, sd: 0, source: "cohort" });
  check(t.value === 50 && Number.isFinite(t.value), "a zero sd gives 50, not NaN or Infinity", String(t.value));
  check(Boolean(t.note), "and says why");
}

// No cohort and no reference: nothing is reported rather than a fake 50.
check(tScore(10, null) === null, "no cohort reports nothing");

// Reference figures are flagged as such.
{
  const t = tScore(10, { count: 2, mean: 9, sd: 2, source: "reference" });
  check(/reference/i.test(t.note ?? ""), "reference figures are labelled");
}

// An empty cohort must not produce NaN.
{
  const { mean, sd } = meanAndSd([]);
  check(mean === 0 && sd === 0, "an empty set gives zeros, not NaN");
}

console.log(failed === 0 ? "\nALL GOOD" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
