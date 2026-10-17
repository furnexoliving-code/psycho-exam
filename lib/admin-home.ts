import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll } from "@/lib/wt/cohort";
import { missingFunction } from "@/lib/wt/session";

/** The three figures of the panel's front page that are counted over many rows. */
export interface HomeCounts {
  /** Distinct signed-in students who submitted a paper since the day began. */
  studentsToday: number;
  /** Distinct students who finished each Full Mock, by the mock's id. */
  mockStudents: Map<string, number>;
  /** The month's paid orders: rupees and how many. */
  paidMonth: { inr: number; orders: number };
}

/**
 * Counted by the database in one call (admin_home_counts,
 * supabase/admin-home.sql). The page used to read the rows a thousand at
 * a time and count them here: thirty requests on a thirty-thousand-attempt
 * day, before the page could draw. On a database without the function
 * yet, it still does, so the deploy and the SQL may land in either order.
 */
export async function homeCounts(dayStart: string, monthStart: string): Promise<HomeCounts> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("admin_home_counts", { p_day_start: dayStart, p_month_start: monthStart });
  if (!error && data) {
    const d = data as { studentsToday?: number; mockStudents?: Record<string, number>; paidMonth?: { inr?: number | string; orders?: number } };
    return {
      studentsToday: Number(d.studentsToday ?? 0),
      mockStudents: new Map(Object.entries(d.mockStudents ?? {}).map(([id, n]) => [id, Number(n)])),
      paidMonth: { inr: Number(d.paidMonth?.inr ?? 0), orders: Number(d.paidMonth?.orders ?? 0) },
    };
  }
  if (error && !missingFunction(error)) throw new Error(error.message);

  const [mockResults, satToday, paidMonth] = await Promise.all([
    fetchAll<{ mock_id: string; user_id: string | null }>((from, to) => supabase.from("mock_results").select("mock_id, user_id").order("id").range(from, to)),
    fetchAll<{ user_id: string | null }>((from, to) => supabase.from("watch_attempts").select("user_id").gte("submitted_at", dayStart).order("id").range(from, to)),
    fetchAll<{ amount_inr: number | string | null }>((from, to) => supabase.from("orders").select("amount_inr").eq("status", "paid").gte("paid_at", monthStart).order("id").range(from, to)),
  ]);
  const sat = new Map<string, Set<string>>();
  for (const r of mockResults) {
    const set = sat.get(r.mock_id) ?? new Set<string>();
    if (r.user_id) set.add(r.user_id);
    sat.set(r.mock_id, set);
  }
  return {
    studentsToday: new Set(satToday.map((r) => r.user_id).filter((u): u is string => Boolean(u))).size,
    mockStudents: new Map([...sat].map(([id, set]) => [id, set.size])),
    paidMonth: { inr: paidMonth.reduce((sum, o) => sum + Number(o.amount_inr ?? 0), 0), orders: paidMonth.length },
  };
}
