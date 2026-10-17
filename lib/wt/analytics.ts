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

/**
 * The whole batch in figures, worked out by the database in one call
 * (admin_analytics, supabase/admin-analytics.sql). The page used to read
 * every attempt through the API a thousand rows at a time and count them
 * here; past a few lakh attempts that outran the time a page may take.
 * On a database without the function yet, the rows are read and counted
 * here as before, so the deploy and the SQL may land in either order.
 */
async function compute(passT: number, targetT: number): Promise<Analytics> {
  const supabase = createAdminClient();
  const now = Date.now();
  const { data, error } = await supabase.rpc("admin_analytics", {
    p_pass_t: passT,
    p_target_t: targetT,
    p_batteries: batteryByCategory(),
    p_battery_ids: BATTERIES.map((b) => b.id),
    p_days: DAYS,
    p_quiet_days: QUIET_AFTER_DAYS,
    p_quiet_limit: QUIET_LIMIT,
  });
  if (!error && data) return assemble(data as Aggregates, passT, targetT, now);
  if (error && !missingFunction(error)) throw new Error(error.message);
  return assemble(aggregateRows(await readRows(supabase), passT, targetT, now), passT, targetT, now);
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
 * who opens the page ten times in a morning costs the database one pass
 * over the attempts, and the students' own pages none.
 */
export async function batchAnalytics(passT: number, targetT: number): Promise<Analytics> {
  return unstable_cache(() => compute(passT, targetT), ["admin-analytics", String(passT), String(targetT)], { tags: [TAG], revalidate: 300 })();
}

/** The admin asked for fresh figures: the next visit works them out again. */
export function analyticsChanged(): void {
  revalidateTag(TAG);
}
