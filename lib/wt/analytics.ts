import { revalidateTag, unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll } from "./cohort";
import { BATTERIES } from "./categories";
import { missingFunction } from "./session";
import {
  DAYS,
  QUIET_AFTER_DAYS,
  QUIET_LIMIT,
  aggregateRows,
  assemble,
  batteryByCategory,
  type Aggregates,
  type Analytics,
  type AnalyticsRows,
  type AttemptRow,
  type MockRow,
  type MockTestRow,
  type PaperRow,
  type StudentRow,
} from "./analytics-core";

export type { Analytics, BatteryReadiness, DayActivity, MockSummary, PaperDifficulty, QuietStudent } from "./analytics-core";

const TAG = "admin-analytics";

/** What admin_analytics is called with; kept with the snapshot so the database's own refresh uses the same. */
interface Params {
  passT: number;
  targetT: number;
  batteries: Record<string, number>;
  batteryIds: number[];
  days: number;
  quietDays: number;
  quietLimit: number;
}

/** The row the database refreshes every ten minutes (supabase/admin-analytics-snapshot.sql). */
interface Snapshot {
  params: Params | null;
  data: Aggregates | null;
  computed_at: string | null;
}

/** A snapshot older than this is worked out afresh: the database's refresh has stopped, or never started. */
const SNAPSHOT_FRESH_MS = 30 * 60 * 1000;

/**
 * The whole batch in figures.
 *
 * Worked out by the database in one call (admin_analytics,
 * supabase/admin-analytics.sql) — and, once supabase/admin-analytics-
 * snapshot.sql has run, worked out there every ten minutes into one row
 * this reads in an instant, since past a few lakh attempts the call
 * itself outran the time a page may take. The row's parameters are kept
 * in step with the portal's own, so a new target or a new kind of paper
 * reaches the next refresh. Without the row, or with one gone stale, the
 * figures are worked out live and kept in the row for the refresh to
 * carry on from. On a database without the function yet, the rows are
 * read and counted here as before, so the deploy and the SQL may land in
 * either order.
 */
async function compute(passT: number, targetT: number): Promise<Analytics> {
  const supabase = createAdminClient();
  const now = Date.now();
  const params: Params = {
    passT,
    targetT,
    batteries: batteryByCategory(),
    batteryIds: BATTERIES.map((b) => b.id),
    days: DAYS,
    quietDays: QUIET_AFTER_DAYS,
    quietLimit: QUIET_LIMIT,
  };

  // The snapshot first: fresh and worked out with these parameters, it is the page.
  const { data: snapshot } = await supabase.from("admin_analytics_snapshot").select("params, data, computed_at").eq("key", "default").maybeSingle();
  const snap = (snapshot as Snapshot | null) ?? null;
  const snapAt = snap?.computed_at ? new Date(snap.computed_at).getTime() : null;
  const snapUsable = snap?.data != null && snapAt !== null && sameParams(snap.params, params);
  if (snapUsable && now - snapAt < SNAPSHOT_FRESH_MS) return assemble(snap.data as Aggregates, passT, targetT, snapAt);

  const { data, error } = await supabase.rpc("admin_analytics", {
    p_pass_t: passT,
    p_target_t: targetT,
    p_batteries: params.batteries,
    p_battery_ids: params.batteryIds,
    p_days: DAYS,
    p_quiet_days: QUIET_AFTER_DAYS,
    p_quiet_limit: QUIET_LIMIT,
  });
  if (!error && data) {
    // Kept for the database's refresh to carry on from, with the parameters
    // it should use. A table not yet made is no reason to lose the page.
    await supabase
      .from("admin_analytics_snapshot")
      .upsert({ key: "default", params, data, computed_at: new Date(now).toISOString() })
      .then(() => undefined, () => undefined);
    return assemble(data as Aggregates, passT, targetT, now);
  }
  if (error && !missingFunction(error)) {
    // The live figures could not be worked out — a call that outran its
    // time on a big table. The figures last cut, stale as they are, beat
    // a page that does not open; the page says when they were cut.
    if (snapUsable) return assemble(snap.data as Aggregates, passT, targetT, snapAt);
    throw new Error(error.message);
  }
  return assemble(aggregateRows(await readRows(supabase), passT, targetT, now), passT, targetT, now);
}

/** Whether a snapshot was worked out with exactly these parameters. */
function sameParams(stored: Params | null, own: Params): boolean {
  if (!stored) return false;
  const keys = (o: Record<string, number>) => Object.keys(o).sort().join(",");
  return (
    Number(stored.passT) === own.passT &&
    Number(stored.targetT) === own.targetT &&
    Number(stored.days) === own.days &&
    Number(stored.quietDays) === own.quietDays &&
    Number(stored.quietLimit) === own.quietLimit &&
    Array.isArray(stored.batteryIds) &&
    stored.batteryIds.map(Number).join(",") === own.batteryIds.join(",") &&
    stored.batteries !== null &&
    typeof stored.batteries === "object" &&
    keys(stored.batteries) === keys(own.batteries) &&
    Object.entries(own.batteries).every(([k, v]) => Number(stored.batteries[k]) === v)
  );
}

/**
 * Asks the database to cut the figures afresh now, as its ten-minute
 * refresh does. True when it did; false when the database has no refresh
 * yet, or the call ran out of time (the refresh will still come round).
 */
export async function refreshSnapshot(): Promise<boolean> {
  const { error } = await createAdminClient().rpc("admin_analytics_refresh");
  return !error;
}

/** Every row the figures need, through the API. */
async function readRows(supabase: ReturnType<typeof createAdminClient>): Promise<AnalyticsRows> {
  const [papersRes, attempts, students, mocks, mockTestsRes] = await Promise.all([
    supabase.from("watch_papers").select("id, slug, display_name, category, is_published, stats_min_attempts, reference_mean, reference_sd"),
    fetchAll<AttemptRow>((from, to) => supabase.from("watch_attempts").select("user_id, paper_id, marks, total, submitted_at").order("submitted_at").order("id").range(from, to)),
    fetchAll<StudentRow>((from, to) => supabase.from("profiles").select("id, full_name, phone, is_active").eq("role", "student").order("created_at").order("id").range(from, to)),
    fetchAll<MockRow>((from, to) => supabase.from("mock_results").select("mock_id, user_id, tests, qualified").order("submitted_at").order("id").range(from, to)),
    supabase.from("mock_tests").select("id, slug, name, sort_order").order("sort_order").order("created_at"),
  ]);
  if (papersRes.error) throw new Error(papersRes.error.message);
  if (mockTestsRes.error) throw new Error(mockTestsRes.error.message);
  return {
    papers: (papersRes.data as PaperRow[] | null) ?? [],
    attempts,
    students,
    mocks,
    mockTests: (mockTestsRes.data as MockTestRow[] | null) ?? [],
  };
}

/**
 * The batch's figures, kept for five minutes. Keeping them means an admin
 * who opens the page ten times in a morning costs the database one small
 * read of the snapshot, and the students' own pages none.
 */
export async function batchAnalytics(passT: number, targetT: number): Promise<Analytics> {
  return unstable_cache(() => compute(passT, targetT), ["admin-analytics", String(passT), String(targetT)], { tags: [TAG], revalidate: 300 })();
}

/** The admin asked for fresh figures: the next visit works them out again. */
export function analyticsChanged(): void {
  revalidateTag(TAG);
}
