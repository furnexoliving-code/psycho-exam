import type { Test } from "./types";
import followingDirections1 from "@/data/tests/following-directions-1.json";
import alpPsycho1 from "@/data/tests/alp-psycho-1.json";

/**
 * Bundled sample papers, used when the site runs without a database. Papers
 * created through the admin panel come from Supabase instead — see lib/db.ts.
 */
const TESTS: Record<string, Test> = {
  "following-directions-1": followingDirections1 as Test,
  "alp-psycho-1": alpPsycho1 as Test,
};

export function getTest(testId: string): Test | undefined {
  return TESTS[testId];
}

export function listTests(): Test[] {
  return Object.values(TESTS);
}

export const DEFAULT_TEST_ID = "following-directions-1";
