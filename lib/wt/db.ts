import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { SAMPLE_PAPER } from "./paper";
import type { WatchCell, WatchPaper, WatchQuestion } from "./types";

/**
 * Loads Watch Table papers from Supabase, mapping them onto the same shape the
 * exam already renders. Candidates read `watch_questions_public`, a view that
 * omits the answer key; only the admin panel reads the key column.
 */

interface PaperRow {
  id: string;
  slug: string;
  title: string;
  display_name: string;
  instruction_time_min: number;
  time_limit_min: number;
  is_published: boolean;
  features: WatchPaper["features"];
  cells: WatchCell[];
  example_cells: WatchCell[];
  image_url: string | null;
  instructions: { en: string; hi: string }[];
  example_text: { en: string; hi: string }[];
  font_scale: number | null;
  image_width_pct: number | null;
  result_view: WatchPaper["resultView"];
}

interface QuestionRow {
  id: string;
  position: number;
  prompt_en: string;
  prompt_hi: string;
  options: number[];
  answer?: number;
  working_en?: string;
  working_hi?: string;
  topic?: string;
}

function toPaper(row: PaperRow, rows: QuestionRow[]): WatchPaper {
  const cells = row.cells?.length ? row.cells : SAMPLE_PAPER.tables[0].cells;
  const example = row.example_cells?.length ? row.example_cells : cells;

  const questions: WatchQuestion[] = rows.map((q) => ({
    id: q.id,
    tableIndex: 0,
    prompt: { en: q.prompt_en, hi: q.prompt_hi },
    options: q.options,
    // Absent for candidates; the submit route scores server-side instead.
    answer: q.answer ?? -1,
    working: { en: q.working_en ?? "", hi: q.working_hi ?? "" },
    topic: q.topic ?? "",
  }));

  return {
    id: row.slug,
    title: row.title,
    displayName: row.display_name,
    features: row.features ?? {},
    timeLimitMin: row.time_limit_min,
    instructionTimeLimitMin: row.instruction_time_min,
    instructions: row.instructions?.length ? row.instructions : SAMPLE_PAPER.instructions,
    example: {
      table: { label: "Example", cells: example },
      text: row.example_text?.length ? row.example_text : SAMPLE_PAPER.example.text,
    },
    tables: [{ label: "No. 1", cells }],
    questions,
    imageUrl: row.image_url ?? undefined,
    fontScale: row.font_scale ?? undefined,
    imageWidthPct: row.image_width_pct ?? undefined,
    resultView: row.result_view ?? {},
  };
}

/** The paper a candidate sits. Never carries the answer key. */
export async function loadPaperForCandidate(slug: string): Promise<WatchPaper | null> {
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("watch_papers")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!row) return null;

  const { data: questions, error } = await supabase
    .from("watch_questions_public")
    .select("id, position, prompt_en, prompt_hi, options, topic")
    .eq("paper_id", (row as PaperRow).id)
    .order("position");

  // Ignoring this error made a failed read look exactly like a paper with no
  // questions, so the exam said "This paper has no questions yet" over a paper
  // holding twenty of them. A paper whose questions cannot be read is unusable
  // either way; saying so beats a wrong explanation.
  if (error) {
    throw new Error(`Could not read the questions for "${slug}": ${error.message}`);
  }

  return toPaper(row as PaperRow, (questions ?? []) as QuestionRow[]);
}

/** The paper as the admin edits it, answer key included. */
export async function loadPaperForAdmin(slug: string): Promise<WatchPaper | null> {
  await requireAdmin();
  // SELECT on watch_questions is revoked from `authenticated` so a candidate
  // cannot read the answer column straight off the table. That revoke applies
  // to the admin's own session too, since an admin is an authenticated user —
  // so the panel reads through the service-role client, behind requireAdmin().
  const supabase = createAdminClient();

  const { data: row } = await supabase
    .from("watch_papers")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!row) return null;

  const { data: questions } = await supabase
    .from("watch_questions")
    .select(
      "id, position, prompt_en, prompt_hi, options, answer, working_en, working_hi, topic",
    )
    .eq("paper_id", (row as PaperRow).id)
    .order("position");

  return toPaper(row as PaperRow, (questions ?? []) as QuestionRow[]);
}

export interface PaperSummary {
  id: string;
  /** watch | letter | number — which of the three this paper is. */
  category: string;
  /** Lower comes first; ties fall back to when the paper was created. */
  sortOrder: number;
  slug: string;
  displayName: string;
  isPublished: boolean;
  questionCount: number;
  instructionTimeMin: number;
  timeLimitMin: number;
}

/** Every paper, published or not, with its real question count. Admins only. */
export async function listPapersForAdmin(): Promise<PaperSummary[]> {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: rows } = await supabase
    .from("watch_papers")
    .select("id, slug, display_name, is_published, instruction_time_min, time_limit_min, category, sort_order")
    .order("category")
    .order("sort_order")
    .order("created_at");
  if (!rows?.length) return [];

  const { data: counts } = await supabase.from("watch_questions").select("paper_id");
  return withCounts(rows, counts ?? []);
}

/**
 * The papers a signed-in student may open.
 *
 * Counts come from the key-free view rather than the questions table, because
 * SELECT on that table is revoked from `authenticated` to keep the answer
 * column out of reach.
 */
export async function listPublishedPapers(): Promise<PaperSummary[]> {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("watch_papers")
    .select("id, slug, display_name, is_published, instruction_time_min, time_limit_min, category, sort_order")
    .eq("is_published", true)
    .order("sort_order")
    .order("created_at");
  if (!rows?.length) return [];

  const { data: counts } = await supabase
    .from("watch_questions_public")
    .select("paper_id");
  return withCounts(rows, counts ?? []);
}

interface PaperRowLite {
  id: string;
  slug: string;
  display_name: string;
  is_published: boolean;
  instruction_time_min: number;
  time_limit_min: number;
  category: string | null;
  sort_order: number | null;
}

function withCounts(
  rows: PaperRowLite[],
  counts: { paper_id: string }[],
): PaperSummary[] {
  const perPaper = new Map<string, number>();
  for (const q of counts) perPaper.set(q.paper_id, (perPaper.get(q.paper_id) ?? 0) + 1);

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    displayName: r.display_name,
    isPublished: r.is_published,
    category: r.category ?? "watch",
    sortOrder: r.sort_order ?? 0,
    questionCount: perPaper.get(r.id) ?? 0,
    instructionTimeMin: r.instruction_time_min,
    timeLimitMin: r.time_limit_min,
  }));
}
