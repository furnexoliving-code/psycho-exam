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

/**
 * What the database's watch_cohort() sums up: everyone ELSE's latest attempt,
 * and this candidate's own latest. Kept as sums rather than a mean so the
 * candidate's own contribution can be added afterwards without a second
 * query — the mark just recorded, or their previous latest.
 */
export interface CohortAggregate {
  others_n: number;
  others_sum: number;
  others_sumsq: number;
  /** Others whose latest mark beats p_marks / falls below it. */
  others_better: number;
  others_worse: number;
  own_latest: number | null;
}

export interface Moments {
  n: number;
  mean: number;
  sd: number;
}

export function momentsOf(marks: number[]): Moments {
  return { n: marks.length, ...meanAndSd(marks) };
}

/**
 * The cohort's figures once this candidate's contribution joins everyone
 * else's latest. Null means they contribute nothing: no attempt on record.
 */
export function momentsFromAggregate(
  agg: CohortAggregate,
  contribution: number | null,
): Moments {
  const n = Number(agg.others_n) + (contribution === null ? 0 : 1);
  if (n === 0) return { n: 0, mean: 0, sd: 0 };
  const sum = Number(agg.others_sum) + (contribution ?? 0);
  const sumsq =
    Number(agg.others_sumsq) + (contribution === null ? 0 : contribution * contribution);
  const mean = sum / n;
  // Population sd from the sums: the marks ARE the whole cohort.
  const sd = Math.sqrt(Math.max(0, sumsq / n - mean * mean));
  return { n, mean, sd };
}

/**
 * Where this candidate stands among everyone else plus themselves — whether
 * or not this paper was recorded, so the same marks always give the same
 * rank. Equal marks share a rank; the percentile counts strictly lower marks.
 */
export function standingFromAggregate(agg: CohortAggregate): {
  rank: number;
  outOf: number;
  percentile: number;
} {
  const outOf = Number(agg.others_n) + 1;
  return {
    rank: Number(agg.others_better) + 1,
    outOf,
    percentile: (Number(agg.others_worse) / outOf) * 100,
  };
}

/**
 * The same aggregate, computed here from the rows. The fallback for a
 * database on which watch_cohort() does not exist yet — the schema file not
 * re-run — so a result is never refused for want of it.
 */
export function aggregateFromRows(
  rows: AttemptMark[],
  userId: string | null,
  total: number,
  marks: number,
): CohortAggregate {
  const mine = userId === null ? [] : rows.filter((r) => r.user_id === userId);
  const theirs = userId === null ? rows : rows.filter((r) => r.user_id !== userId);
  const others = cohortMarks(theirs, total);
  return {
    others_n: others.length,
    others_sum: others.reduce((sum, m) => sum + m, 0),
    others_sumsq: others.reduce((sum, m) => sum + m * m, 0),
    others_better: others.filter((m) => m > marks).length,
    others_worse: others.filter((m) => m < marks).length,
    own_latest: cohortMarks(mine, total)[0] ?? null,
  };
}

/** Supabase answers at most this many rows per request; beyond it, page. */
const PAGE = 1000;

/**
 * Every row of a query, page by page. A plain select stops at a thousand
 * rows without saying so, which is exactly the size at which a results
 * table or an analysis starts to matter.
 */
export async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) return out;
  }
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
  return cohortFromMoments(momentsOf(marks), paper);
}

export function cohortFromMoments(moments: Moments, paper: CohortSettings): Cohort | null {
  const minimum = paper.stats_min_attempts ?? 5;

  if (moments.n >= minimum) {
    return { count: moments.n, mean: moments.mean, sd: moments.sd, source: "cohort" };
  }
  if (paper.reference_mean !== null && paper.reference_sd !== null) {
    return {
      count: moments.n,
      mean: Number(paper.reference_mean),
      sd: Number(paper.reference_sd),
      source: "reference",
    };
  }
  return null;
}
