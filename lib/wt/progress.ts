import { createAdminClient } from "@/lib/supabase/admin";
import { indianDay } from "@/lib/format-time";
import { BATTERIES, CATEGORIES } from "./categories";
import { cohortFromMoments } from "./cohort";
import { tScore } from "./tscore";

export interface DayScore {
  /** YYYY-MM-DD in India. */
  day: string;
  /** The best T-score of that day's attempts in the battery; null for none. */
  bestT: number | null;
  attempts: number;
}

export interface BatteryProgress {
  battery: number;
  title: string;
  /** The best T-score of any paper in the battery; null before any is measured. */
  bestT: number | null;
  attempts: number;
  papersSat: number;
  lastAt: string | null;
  /** The last three days, oldest first, today last. */
  days: DayScore[];
  /** Today's attempts in this battery. */
  today: number;
  /** Papers attempted today, by id. */
  todayPapers: string[];
}

/**
 * How a candidate stands in every battery: their best T-score among the
 * papers they have sat, measured on each paper against everyone who has
 * sat it, and the best of each of the last three days. One call for the
 * cohort figures of every paper touched.
 */
export async function batteryProgress(userId: string): Promise<BatteryProgress[]> {
  const supabase = createAdminClient();
  const now = Date.now();
  const days = [2, 1, 0].map((back) => indianDay(now - back * 86400000));

  const empty = (): BatteryProgress[] =>
    BATTERIES.map((b) => ({
      battery: b.id,
      title: b.title,
      bestT: null,
      attempts: 0,
      papersSat: 0,
      lastAt: null,
      days: days.map((day) => ({ day, bestT: null, attempts: 0 })),
      today: 0,
      todayPapers: [],
    }));
  const byBattery = new Map<number, BatteryProgress>(empty().map((p) => [p.battery, p]));

  const { data: attempts } = await supabase
    .from("watch_attempts")
    .select("paper_id, marks, total, submitted_at")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false })
    .limit(3000);
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
    const value = t ? Number(t.value.toFixed(1)) : null;
    if (value !== null && (row.bestT === null || value > row.bestT)) row.bestT = value;

    const day = indianDay(a.submitted_at as string);
    const slot = row.days.find((d) => d.day === day);
    if (slot) {
      slot.attempts++;
      if (value !== null && (slot.bestT === null || value > slot.bestT)) slot.bestT = value;
    }
    if (day === days[2]) {
      row.today++;
      if (!row.todayPapers.includes(a.paper_id as string)) row.todayPapers.push(a.paper_id as string);
    }
  }
  for (const [battery, set] of papersPerBattery) {
    const row = byBattery.get(battery);
    if (row) row.papersSat = set.size;
  }
  return [...byBattery.values()];
}

/** True when every battery named has reached the bar in sectional practice. */
export function clearedBar(progress: BatteryProgress[], batteries: number[], bar: number): boolean {
  return batteries.every((b) => {
    const p = progress.find((x) => x.battery === b);
    return p !== undefined && p.bestT !== null && p.bestT >= bar;
  });
}

/**
 * The student's best T-score on each of the papers named, measured the
 * way the result page measures it (the paper's cohort, or its reference
 * figures). Papers never sat, or not yet measurable, are absent.
 */
export async function paperBestT(userId: string, paperIds: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (paperIds.length === 0) return out;
  const supabase = createAdminClient();
  const [{ data: attempts }, { data: papers }, { data: cohorts }] = await Promise.all([
    supabase.from("watch_attempts").select("paper_id, marks, total").eq("user_id", userId).in("paper_id", paperIds).limit(3000),
    supabase.from("watch_papers").select("id, stats_min_attempts, reference_mean, reference_sd").in("id", paperIds),
    supabase.rpc("watch_cohorts", { p_papers: paperIds }),
  ]);
  const paperById = new Map((papers ?? []).map((p) => [p.id as string, p]));
  const cohortRows = (cohorts as { paper_id: string; total: number; n: number; mean: number; sd: number }[] | null) ?? [];
  for (const a of attempts ?? []) {
    const paper = paperById.get(a.paper_id as string);
    if (!paper) continue;
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
    if (!t) continue;
    const value = Number(t.value.toFixed(1));
    const best = out.get(a.paper_id as string);
    if (best === undefined || value > best) out.set(a.paper_id as string, value);
  }
  return out;
}
