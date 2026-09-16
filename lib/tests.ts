import type { Test } from "./types";
import alpPsycho1 from "@/data/tests/alp-psycho-1.json";

/**
 * Tests are bundled as JSON so the portal runs without a backend. Adding a
 * paper means dropping a file in data/tests/ and registering it here.
 */
const TESTS: Record<string, Test> = {
  "alp-psycho-1": alpPsycho1 as Test,
};

export function getTest(testId: string): Test | undefined {
  return TESTS[testId];
}

export function listTests(): Test[] {
  return Object.values(TESTS);
}

export const DEFAULT_TEST_ID = "alp-psycho-1";
