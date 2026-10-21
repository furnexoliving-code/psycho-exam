import { createAdminClient } from "@/lib/supabase/admin";
import { listPublishedPapers } from "./db";

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

/** One attempt as the table holds it: what every page's figures are made from. */
export interface AttemptRecord {
  id: string;
  paper_id: string;
  marks: number;
  total: number;
  attempted: number;
  submitted_at: string;
}

/**
 * A candidate's own attempts, newest first, on the papers named or on every
 * paper: one read, from which a page derives all its per-paper figures.
 */
export async function attemptRecordsFor(userId: string, limit = 20, paperIds?: string[]): Promise<AttemptRecord[]> {
  if (paperIds && paperIds.length === 0) return [];

  // Only the papers named, when a page is about a few of them: a series
  // page used to read every attempt the student ever made.
  let query = createAdminClient()
    .from("watch_attempts")
    .select("id, paper_id, marks, total, attempted, submitted_at")
    .eq("user_id", userId);
  if (paperIds) query = query.in("paper_id", paperIds);
  const { data } = await query.order("submitted_at", { ascending: false }).limit(limit);
  return (data ?? []) as AttemptRecord[];
}

/**
 * A candidate's own Watch Table attempts, newest first, each with its
 * paper's name.
 *
 * The dashboard used to read the older `attempts` table, which these never
 * touch — so a student who had sat three papers was told they had completed
 * none. The papers' names come from the published list, which every page
 * already holds from its cache; only a paper missing from it (unpublished
 * since, or deleted) is looked up, and a deleted one is named plainly.
 */
export async function attemptsFor(userId: string, limit = 20, paperIds?: string[]): Promise<PastAttemptRow[]> {
  const data = await attemptRecordsFor(userId, limit, paperIds);
  if (!data.length) return [];

  const published = await listPublishedPapers();
  const byId = new Map<string, { slug: string; display_name: string; category: string }>(
    published.map((p) => [p.id, { slug: p.slug, display_name: p.displayName, category: p.category }]),
  );
  const missing = [...new Set(data.map((a) => a.paper_id))].filter((id) => !byId.has(id));
  if (missing.length) {
    const { data: papers } = await createAdminClient()
      .from("watch_papers")
      .select("id, slug, display_name, category")
      .in("id", missing);
    for (const p of papers ?? []) byId.set(p.id, p);
  }

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
