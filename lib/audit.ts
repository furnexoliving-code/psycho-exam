import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * A line in the panel's log: who did what, when.
 *
 * Written after the action has succeeded, and never allowed to fail it: a
 * log that could block a password reset would be a worse problem than a
 * missing line. A database on which the newest SQL has not been run yet
 * has no table, and the write simply does nothing.
 */
export async function logAction(action: string, details = ""): Promise<void> {
  try {
    const who = await getProfile();
    await createAdminClient().from("audit_log").insert({
      actor_id: who?.id ?? null,
      actor_name: who?.full_name ?? "",
      actor_role: who?.role ?? "",
      action,
      details: details.slice(0, 2000),
    });
  } catch {
    // Never the action's problem.
  }
}

export interface AuditRow {
  id: number;
  at: string;
  actor_name: string;
  actor_role: string;
  action: string;
  details: string;
}

/** The newest lines, for the panel. Empty on a database without the table. */
export async function recentActions(limit = 100): Promise<AuditRow[]> {
  try {
    const { data } = await createAdminClient()
      .from("audit_log")
      .select("id, at, actor_name, actor_role, action, details")
      .order("at", { ascending: false })
      .limit(limit);
    return (data ?? []) as AuditRow[];
  } catch {
    return [];
  }
}
