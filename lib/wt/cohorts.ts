import { revalidateTag, unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { PAPERS_TAG } from "./db";

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

/** A result was recorded, or attempts were removed: the cohorts are read afresh on the next visit. */
export function cohortsChanged(): void {
  revalidateTag(COHORTS_TAG);
}
