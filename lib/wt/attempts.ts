import { createAdminClient } from "@/lib/supabase/admin";

export interface AttemptAllowance {
  /** null when the paper sets no limit. */
  max: number | null;
  used: number;
  /** null when there is no limit; otherwise never negative. */
  remaining: number | null;
  exhausted: boolean;
}

/**
 * How many times this candidate may still sit this paper.
 *
 * Counted with the service-role client on purpose. Row level security lets a
 * candidate see their own attempts, so a count taken with their session would
 * be correct today — but the limit is a rule the institute sets, and a rule
 * enforced from data the person being limited controls is not enforced at all.
 */
export async function allowanceFor(
  paperId: string,
  userId: string | null,
): Promise<AttemptAllowance> {
  const supabase = createAdminClient();

  const { data: paper } = await supabase
    .from("watch_papers")
    .select("id, max_attempts")
    .eq("slug", paperId)
    .maybeSingle();

  const max =
    paper?.max_attempts === null || paper?.max_attempts === undefined
      ? null
      : Number(paper.max_attempts);

  // A signed-out visitor has nothing to count against, so a limited paper is
  // simply closed to them rather than open without limit.
  if (!userId) {
    return max === null
      ? { max: null, used: 0, remaining: null, exhausted: false }
      : { max, used: 0, remaining: 0, exhausted: true };
  }
  if (!paper) return { max: null, used: 0, remaining: null, exhausted: false };

  const { count } = await supabase
    .from("watch_attempts")
    .select("id", { count: "exact", head: true })
    .eq("paper_id", paper.id)
    .eq("user_id", userId);

  const used = count ?? 0;
  if (max === null) return { max: null, used, remaining: null, exhausted: false };

  const remaining = Math.max(0, max - used);
  return { max, used, remaining, exhausted: remaining === 0 };
}
