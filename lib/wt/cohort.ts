import type { Cohort } from "./tscore";
import { meanAndSd } from "./tscore";

/** The columns of a recorded attempt the cohort is built from. */
export interface AttemptMark {
  user_id: string | null;
  marks: number;
  total: number;
  submitted_at: string;
}

/**
 * One mark per candidate: their LATEST attempt of the paper.
 *
 * Counting every attempt let one student who re-sat a paper twenty times set
 * its mean, its standard deviation and everyone else's T-score and rank — and
 * be ranked against their own earlier papers. A cohort is people, not sittings.
 *
 * Attempts of a different length are left out: a paper whose questions were
 * replaced keeps its old attempts, and a mark out of 10 says nothing about a
 * mark out of 20.
 */
export function cohortMarks(rows: AttemptMark[], total: number): number[] {
  const latest = new Map<string, AttemptMark>();
  const anonymous: number[] = [];

  for (const row of rows) {
    if (row.total !== total) continue;
    if (!row.user_id) {
      // Rows from before accounts were required have no one to fold into.
      anonymous.push(row.marks);
      continue;
    }
    const seen = latest.get(row.user_id);
    if (!seen || row.submitted_at > seen.submitted_at) latest.set(row.user_id, row);
  }

  return [...[...latest.values()].map((r) => r.marks), ...anonymous];
}

export interface CohortSettings {
  stats_min_attempts: number | null;
  reference_mean: number | null;
  reference_sd: number | null;
}

/**
 * The figures a T-score is measured against: the live cohort once enough
 * candidates have sat the paper, the institute's reference figures until
 * then, and nothing at all when there are neither.
 */
export function cohortFor(marks: number[], paper: CohortSettings): Cohort | null {
  const minimum = paper.stats_min_attempts ?? 5;

  if (marks.length >= minimum) {
    const { mean, sd } = meanAndSd(marks);
    return { count: marks.length, mean, sd, source: "cohort" };
  }
  if (paper.reference_mean !== null && paper.reference_sd !== null) {
    return {
      count: marks.length,
      mean: Number(paper.reference_mean),
      sd: Number(paper.reference_sd),
      source: "reference",
    };
  }
  return null;
}
