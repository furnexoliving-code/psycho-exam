import { createAdminClient } from "@/lib/supabase/admin";

export interface PastAttemptRow {
  id: string;
  paperSlug: string;
  paperName: string;
  category: string;
  marks: number;
  total: number;
  attempted: number;
  submittedAt: string;
}

/**
 * A candidate's own Watch Table attempts, newest first.
 *
 * The dashboard used to read the older `attempts` table, which these never
 * touch — so a student who had sat three papers was told they had completed
 * none. Read with the service-role client because the paper's name lives on
 * watch_papers and the join is simpler than two policy-guarded reads.
 */
export async function attemptsFor(userId: string, limit = 20): Promise<PastAttemptRow[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("watch_attempts")
    .select("id, paper_id, marks, total, attempted, submitted_at")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false })
    .limit(limit);

  if (!data?.length) return [];

  const { data: papers } = await supabase
    .from("watch_papers")
    .select("id, slug, display_name, category")
    .in("id", [...new Set(data.map((a) => a.paper_id))]);

  const byId = new Map((papers ?? []).map((p) => [p.id, p]));

  return data.map((a) => {
    const paper = byId.get(a.paper_id);
    return {
      id: a.id,
      paperSlug: paper?.slug ?? "",
      // A deleted paper leaves its attempts behind; naming it plainly beats a
      // blank cell that looks like a bug.
      paperName: paper?.display_name ?? "A deleted test",
      category: paper?.category ?? "watch",
      marks: a.marks,
      total: a.total,
      attempted: a.attempted,
      submittedAt: a.submitted_at,
    };
  });
}
