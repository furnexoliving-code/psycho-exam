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
export async function allowanceFor(paperDbId: string, max: number | null, userId: string): Promise<AttemptAllowance> {
  // No limit, nothing to count: the exam page asks only when the paper sets
  // one, and the lists tally their counts from rows they already hold.
  if (max === null) return { max: null, used: 0, remaining: null, exhausted: false };
  const used = await countAttempts(paperDbId, userId);

  const remaining = Math.max(0, max - used);
  return { max, used, remaining, exhausted: remaining === 0 };
}

async function countAttempts(paperDbId: string, userId: string): Promise<number> {
  const { count } = await createAdminClient().from("watch_attempts").select("id", { count: "exact", head: true }).eq("paper_id", paperDbId).eq("user_id", userId);
  return count ?? 0;
}

/**
 * The same answer for many papers, in one query rather than one per paper.
 *
 * Asking one paper at a time meant a page listing ten papers made twenty
 * round trips before it could render, and the count grew with the catalogue.
 * Under a batch of students all opening their page at once, that is the
 * difference between a page and a queue.
 */
export async function allowancesFor(papers: { id: string; slug: string; maxAttempts: number | null }[], userId: string): Promise<Map<string, AttemptAllowance>> {
  if (papers.length === 0) return new Map();

  // One query for every paper at once. Postgres returns the rows; the
  // tallying is cheaper here than a round trip each.
  const { data: attempts } = await createAdminClient()
    .from("watch_attempts")
    .select("paper_id")
    .eq("user_id", userId)
    .in(
      "paper_id",
      papers.map((p) => p.id),
    );
  return allowancesFromRows(papers, attempts ?? []);
}

/**
 * The same tally from attempt rows already in hand: a page that has read
 * the student's attempts for another reason need not read them again.
 */
export function allowancesFromRows(papers: { id: string; slug: string; maxAttempts: number | null }[], attempts: { paper_id: string }[]): Map<string, AttemptAllowance> {
  const out = new Map<string, AttemptAllowance>();
  if (papers.length === 0) return out;

  const used = new Map<string, number>();
  for (const a of attempts) {
    used.set(a.paper_id, (used.get(a.paper_id) ?? 0) + 1);
  }

  for (const paper of papers) {
    const count = used.get(paper.id) ?? 0;
    const max = paper.maxAttempts;
    out.set(
      paper.slug,
      max === null
        ? { max: null, used: count, remaining: null, exhausted: false }
        : {
            max,
            used: count,
            remaining: Math.max(0, max - count),
            exhausted: max - count <= 0,
          },
    );
  }

  return out;
}
