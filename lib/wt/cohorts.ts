import { revalidateTag, unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { PAPERS_TAG } from "./db";
import { cohortFromMoments, fetchAll } from "./cohort";
import { tScore } from "./tscore";

const COHORTS_TAG = "wt-cohorts";

/** One paper's cohort over one paper length: how many latest attempts, their mean and standard deviation. */
export interface CohortRow {
  paper_id: string;
  total: number;
  n: number;
  mean: number;
  sd: number;
}

/** The figures a paper's T-score is judged by, besides the cohort itself. */
export interface PaperStat {
  id: string;
  category: string;
  stats_min_attempts: number | null;
  reference_mean: number | null;
  reference_sd: number | null;
}

/**
 * Every paper's cohort figures, worked out once and kept for a minute, and
 * dropped the moment a result is recorded. The dashboard, the practice
 * list and a series page read these for a student's best T-scores; each
 * used to ask the database to work them out afresh on every visit, over
 * every attempt of every paper the student had sat.
 *
 * A result page and a mock scorecard keep asking the database live: those
 * are the figures of record, and a minute's staleness there would show.
 */
export async function allCohorts(): Promise<CohortRow[]> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient();
      const { data: papers } = await supabase.from("watch_papers").select("id");
      const ids = (papers ?? []).map((p) => p.id as string);
      if (ids.length === 0) return [];
      const { data } = await supabase.rpc("watch_cohorts", { p_papers: ids });
      return ((data as CohortRow[] | null) ?? []).map((r) => ({
        paper_id: r.paper_id,
        total: Number(r.total),
        n: Number(r.n),
        mean: Number(r.mean),
        sd: Number(r.sd),
      }));
    },
    ["wt-cohorts"],
    { tags: [COHORTS_TAG], revalidate: 60 },
  )();
}

/** The cohort rows of the papers named. */
export async function cohortsFor(paperIds: string[]): Promise<CohortRow[]> {
  if (paperIds.length === 0) return [];
  const wanted = new Set(paperIds);
  return (await allCohorts()).filter((r) => wanted.has(r.paper_id));
}

/** Every paper's T-score settings, kept with the papers themselves and dropped when a paper changes. */
export async function paperStats(): Promise<Map<string, PaperStat>> {
  const rows = await unstable_cache(
    async () => {
      const { data } = await createAdminClient()
        .from("watch_papers")
        .select("id, category, stats_min_attempts, reference_mean, reference_sd");
      return ((data as PaperStat[] | null) ?? []).map((p) => ({
        id: p.id,
        category: p.category,
        stats_min_attempts: p.stats_min_attempts === null ? null : Number(p.stats_min_attempts),
        reference_mean: p.reference_mean === null ? null : Number(p.reference_mean),
        reference_sd: p.reference_sd === null ? null : Number(p.reference_sd),
      }));
    },
    ["wt-paper-stats"],
    { tags: [PAPERS_TAG, COHORTS_TAG], revalidate: 300 },
  )();
  return new Map(rows.map((p) => [p.id, p]));
}

/** How many attempts, and how many different students, each paper has. */
export interface AttemptCount {
  attempts: number;
  students: number;
}

/**
 * Every paper's attempt count, by the database's own view, or by paging
 * through the attempts until supabase/attempt-counts.sql has been run.
 * The Results page used to ask for every attempt row at once, and the
 * API answers at most a thousand, so the later papers read 0.
 */
export async function attemptCounts(): Promise<Map<string, AttemptCount>> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("watch_attempt_counts").select("paper_id, attempts, students");
  if (!error && data) {
    return new Map((data as { paper_id: string; attempts: number; students: number }[]).map((r) => [r.paper_id, { attempts: Number(r.attempts), students: Number(r.students) }]));
  }
  const rows = await fetchAll<{ paper_id: string; user_id: string | null }>((from, to) =>
    supabase.from("watch_attempts").select("paper_id, user_id").order("id").range(from, to),
  );
  const seen = new Map<string, Set<string>>();
  const counts = new Map<string, AttemptCount>();
  for (const r of rows) {
    const c = counts.get(r.paper_id) ?? { attempts: 0, students: 0 };
    c.attempts += 1;
    if (r.user_id) {
      const s = seen.get(r.paper_id) ?? new Set<string>();
      if (!s.has(r.user_id)) {
        s.add(r.user_id);
        c.students += 1;
      }
      seen.set(r.paper_id, s);
    }
    counts.set(r.paper_id, c);
  }
  return counts;
}

/** A result was recorded, or attempts were removed: the cohorts are read afresh on the next visit. */
export function cohortsChanged(): void {
  revalidateTag(COHORTS_TAG);
}

/**
 * The T-score of each attempt named, from the cached cohorts: the way the
 * result page measures it, over the paper's current length. Null where the
 * cohort is too small and no reference figures are set.
 */
export async function tScoresOf(rows: { paperId: string; marks: number; total: number }[]): Promise<(number | null)[]> {
  if (rows.length === 0) return [];
  const [cohorts, stats] = await Promise.all([allCohorts(), paperStats()]);
  const byKey = new Map(cohorts.map((c) => [`${c.paper_id}:${c.total}`, c]));
  return rows.map((r) => {
    const paper = stats.get(r.paperId);
    if (!paper) return null;
    const c = byKey.get(`${r.paperId}:${r.total}`);
    const cohort = cohortFromMoments(c ? { n: c.n, mean: c.mean, sd: c.sd } : { n: 0, mean: 0, sd: 0 }, {
      stats_min_attempts: paper.stats_min_attempts,
      reference_mean: paper.reference_mean,
      reference_sd: paper.reference_sd,
    });
    const t = tScore(r.marks, cohort);
    return t ? Number(t.value.toFixed(1)) : null;
  });
}
