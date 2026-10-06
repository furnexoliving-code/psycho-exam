import { createAdminClient } from "@/lib/supabase/admin";
import { BATTERIES, CATEGORIES } from "./categories";
import { cohortFromMoments } from "./cohort";
import { tScore } from "./tscore";

export interface BatteryProgress {
  battery: number;
  title: string;
  /** The best T-score of any paper in the battery; null before any is measured. */
  bestT: number | null;
  attempts: number;
  papersSat: number;
  lastAt: string | null;
}

/**
 * How a candidate stands in every battery: their best T-score among the
 * papers they have sat, measured on each paper against everyone who has
 * sat it. One call for the cohort figures of every paper touched.
 */
export async function batteryProgress(userId: string): Promise<BatteryProgress[]> {
  const supabase = createAdminClient();
  const { data: attempts } = await supabase
    .from("watch_attempts")
    .select("paper_id, marks, total, submitted_at")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false })
    .limit(2000);

  const byBattery = new Map<number, BatteryProgress>(
    BATTERIES.map((b) => [b.id, { battery: b.id, title: b.title, bestT: null, attempts: 0, papersSat: 0, lastAt: null }]),
  );
  if (!attempts?.length) return [...byBattery.values()];

  const paperIds = [...new Set(attempts.map((a) => a.paper_id as string))];
  const [{ data: papers }, { data: cohorts }] = await Promise.all([
    supabase.from("watch_papers").select("id, category, stats_min_attempts, reference_mean, reference_sd").in("id", paperIds),
    supabase.rpc("watch_cohorts", { p_papers: paperIds }),
  ]);
  const paperById = new Map((papers ?? []).map((p) => [p.id as string, p]));
  const cohortRows = (cohorts as { paper_id: string; total: number; n: number; mean: number; sd: number }[] | null) ?? [];

  const papersPerBattery = new Map<number, Set<string>>();
  for (const a of attempts) {
    const paper = paperById.get(a.paper_id as string);
    if (!paper) continue;
    const battery = CATEGORIES.find((c) => c.id === paper.category)?.battery ?? 2;
    const row = byBattery.get(battery);
    if (!row) continue;
    row.attempts++;
    if (!row.lastAt) row.lastAt = a.submitted_at as string;
    const set = papersPerBattery.get(battery) ?? new Set<string>();
    set.add(a.paper_id as string);
    papersPerBattery.set(battery, set);

    const total = Number(a.total);
    const c = cohortRows.find((r) => r.paper_id === a.paper_id && Number(r.total) === total);
    const cohort = cohortFromMoments(
      c ? { n: Number(c.n), mean: Number(c.mean), sd: Number(c.sd) } : { n: 0, mean: 0, sd: 0 },
      {
        stats_min_attempts: paper.stats_min_attempts as number | null,
        reference_mean: paper.reference_mean as number | null,
        reference_sd: paper.reference_sd as number | null,
      },
    );
    const t = tScore(Number(a.marks), cohort);
    if (t && (row.bestT === null || t.value > row.bestT)) row.bestT = Number(t.value.toFixed(1));
  }
  for (const [battery, set] of papersPerBattery) {
    const row = byBattery.get(battery);
    if (row) row.papersSat = set.size;
  }
  return [...byBattery.values()];
}
