import { revalidateTag, unstable_cache } from "next/cache";
import { requireEditor } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { SAMPLE_PAPER, defaultInstructions } from "./paper";
import type { WatchCell, WatchPaper, WatchQuestion } from "./types";

/**
 * Loads Watch Table papers from Supabase, mapping them onto the same shape the
 * exam already renders. Candidates read `watch_questions_public`, a view that
 * omits the answer key; only the admin panel reads the key column.
 *
 * What every student sees is the same — the published papers and their
 * questions — and it changes a few times a day, when the institute edits
 * it. So those reads are served from a cache shared by every request and
 * emptied the moment an admin saves; a thousand students opening a paper
 * together cost the database one read, not a thousand. Anything about ONE
 * student — their attempts, their sitting, who they are — is never cached.
 */

/** Every cached read of published papers carries this tag. */
const PAPERS_TAG = "papers";
/** ...and each paper its own, so one edit empties one paper. */
const paperTag = (slug: string) => `paper:${slug}`;

/** Even without an edit, nothing cached outlives this many seconds. */
const CACHE_SECONDS = 300;

/**
 * Called by every admin write that touches a paper or its questions, so the
 * next student request reads the new version. The slug is the paper edited;
 * without one, only the lists are emptied.
 */
export function paperChanged(slug?: string): void {
  revalidateTag(PAPERS_TAG);
  if (slug) revalidateTag(paperTag(slug));
}

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
  example_text: { en: string; hi: string }[] | null;
  font_scale: number | null;
  image_width_pct: number | null;
  result_view: WatchPaper["resultView"];
  max_attempts: number | null;
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
    dbId: row.id,
    maxAttempts: row.max_attempts ?? null,
    title: row.title,
    displayName: row.display_name,
    features: row.features ?? {},
    timeLimitMin: row.time_limit_min,
    instructionTimeLimitMin: row.instruction_time_min,
    instructions: row.instructions?.length
      ? row.instructions
      : defaultInstructions(row.instruction_time_min, row.time_limit_min),
    example: {
      table: { label: "Example", cells: example },
      // Null means never set, and the sample's wording stands in. An empty
      // list is the institute's own choice — a cleared example stays cleared
      // rather than the sample coming back.
      text: row.example_text === null ? SAMPLE_PAPER.example.text : row.example_text,
    },
    tables: [{ label: "No. 1", cells }],
    questions,
    imageUrl: row.image_url ?? undefined,
    fontScale: row.font_scale ?? undefined,
    imageWidthPct: row.image_width_pct ?? undefined,
    resultView: row.result_view ?? {},
  };
}

/** The columns of a question a candidate may see. The key is not among them. */
const PUBLIC_QUESTION_COLUMNS = "id, position, prompt_en, prompt_hi, options, topic";

/**
 * The paper a candidate sits. Never carries the answer key.
 *
 * Served from the shared cache: a published paper is the same for everyone.
 * Read with the service-role client because a cached read cannot depend on
 * the caller's cookies — and filtered to published papers, since that client
 * sees drafts too. Only the public columns are selected, so the key is not
 * merely stripped from the cached copy: it is never read into it.
 */
export async function loadPaperForCandidate(slug: string): Promise<WatchPaper | null> {
  try {
    return await unstable_cache(
      async () => {
        const supabase = createAdminClient();

        // A failed read is thrown, never returned: a thrown callback is not
        // cached, whereas a null returned on a passing timeout would have
        // made the paper vanish for every student for five minutes.
        const { data: row, error: rowError } = await supabase
          .from("watch_papers")
          .select("*")
          .eq("slug", slug)
          .eq("is_published", true)
          .maybeSingle();
        if (rowError) throw new Error(`Could not read the paper "${slug}": ${rowError.message}`);
        // Nor is "not published" memoised: a paper published a moment later
        // must not answer "not found" until the cache turns over.
        if (!row) throw new NotPublished();

        const { data: questions, error } = await supabase
          .from("watch_questions")
          .select(PUBLIC_QUESTION_COLUMNS)
          .eq("paper_id", (row as PaperRow).id)
          .order("position");
        if (error) throw new Error(`Could not read the questions for "${slug}": ${error.message}`);

        return toPaper(row as PaperRow, (questions ?? []) as QuestionRow[]);
      },
      ["published-paper", slug],
      { tags: [PAPERS_TAG, paperTag(slug)], revalidate: CACHE_SECONDS },
    )();
  } catch (error) {
    if (error instanceof NotPublished) return null;
    throw error;
  }
}

/** Thrown inside a cached read so that an absence is not stored as an answer. */
class NotPublished extends Error {}

/**
 * The same paper, read live under the caller's own rights — for an admin
 * previewing a draft, which the cache above deliberately does not hold.
 */
export async function loadPaperLive(slug: string): Promise<WatchPaper | null> {
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("watch_papers")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!row) return null;

  const { data: questions, error } = await supabase
    .from("watch_questions_public")
    .select(PUBLIC_QUESTION_COLUMNS)
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
  await requireEditor();
  // SELECT on watch_questions is revoked from `authenticated` so a candidate
  // cannot read the answer column straight off the table. That revoke applies
  // to the admin's own session too, since an admin is an authenticated user —
  // so the panel reads through the service-role client, behind requireEditor().
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
  /** How many sittings the paper allows; null for no limit. */
  maxAttempts: number | null;
}

const SUMMARY_COLUMNS =
  "id, slug, display_name, is_published, instruction_time_min, time_limit_min, category, sort_order, max_attempts";

/** Every paper, published or not, with its real question count. Admin and editor only. */
export async function listPapersForAdmin(): Promise<PaperSummary[]> {
  await requireEditor();
  const supabase = createAdminClient();

  const { data: rows } = await supabase
    .from("watch_papers")
    .select(SUMMARY_COLUMNS)
    .order("category")
    .order("sort_order")
    .order("created_at");
  if (!rows?.length) return [];

  const { data: counts } = await supabase
    .from("watch_question_counts")
    .select("paper_id, question_count")
    .in("paper_id", rows.map((r) => r.id));
  return withCounts(rows, counts ?? []);
}

/**
 * The papers a signed-in student may open, optionally of one kind. The same
 * list for everyone, so it is served from the shared cache.
 *
 * Counts come from a grouped view rather than one row per question: the
 * dashboard used to pull every question of every paper to count them.
 */
export async function listPublishedPapers(category?: string): Promise<PaperSummary[]> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient();

      let query = supabase
        .from("watch_papers")
        .select(SUMMARY_COLUMNS)
        .eq("is_published", true);
      if (category) query = query.eq("category", category);

      const { data: rows, error } = await query.order("sort_order").order("created_at");
      // Thrown, not returned as an empty list: a failed read cached as "no
      // papers" would tell every student there is nothing to sit.
      if (error) throw new Error(`Could not read the papers: ${error.message}`);
      if (!rows?.length) return [];

      const { data: counts, error: countError } = await supabase
        .from("watch_question_counts")
        .select("paper_id, question_count")
        .in("paper_id", rows.map((r) => r.id));
      if (countError) throw new Error(`Could not count the questions: ${countError.message}`);
      return withCounts(rows, counts ?? []);
    },
    ["published-papers", category ?? "all"],
    { tags: [PAPERS_TAG], revalidate: CACHE_SECONDS },
  )();
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
  max_attempts: number | null;
}

function withCounts(
  rows: PaperRowLite[],
  counts: { paper_id: string; question_count: number }[],
): PaperSummary[] {
  const perPaper = new Map(counts.map((c) => [c.paper_id, c.question_count]));

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
    maxAttempts: r.max_attempts === null || r.max_attempts === undefined ? null : Number(r.max_attempts),
  }));
}

/** What the result page shows beside the review: the diagram and the name. No questions, no key. */
export interface PaperHeader {
  displayName: string;
  timeLimitMin: number;
  table: WatchPaper["tables"][number];
  imageUrl?: string;
  imageWidthPct?: number;
}

/**
 * The result page used to load the whole paper, questions included, and use
 * five fields of it — while the score route fetched the same questions again
 * with the key. This reads the five fields.
 */
export async function loadPaperHeader(slug: string): Promise<PaperHeader | null> {
  try {
    return await unstable_cache(
      async () => {
        const header = await readHeader(createAdminClient(), slug, true);
        if (!header) throw new NotPublished();
        return header;
      },
      ["published-paper-header", slug],
      { tags: [PAPERS_TAG, paperTag(slug)], revalidate: CACHE_SECONDS },
    )();
  } catch (error) {
    if (error instanceof NotPublished) return null;
    throw error;
  }
}

/** The header read live, under the caller's rights — for an admin's draft. */
export async function loadPaperHeaderLive(slug: string): Promise<PaperHeader | null> {
  return readHeader(await createClient(), slug, false);
}

async function readHeader(
  supabase: ReturnType<typeof createAdminClient> | Awaited<ReturnType<typeof createClient>>,
  slug: string,
  publishedOnly: boolean,
): Promise<PaperHeader | null> {
  let query = supabase
    .from("watch_papers")
    .select("display_name, time_limit_min, cells, image_url, image_width_pct")
    .eq("slug", slug);
  if (publishedOnly) query = query.eq("is_published", true);
  const { data: row, error } = await query.maybeSingle();
  if (error) throw new Error(`Could not read the paper "${slug}": ${error.message}`);
  if (!row) return null;

  const cells = (row.cells as WatchCell[] | null)?.length
    ? (row.cells as WatchCell[])
    : SAMPLE_PAPER.tables[0].cells;

  return {
    displayName: row.display_name,
    timeLimitMin: row.time_limit_min,
    table: { label: "No. 1", cells },
    imageUrl: row.image_url ?? undefined,
    imageWidthPct: row.image_width_pct ?? undefined,
  };
}

export function headerOf(paper: WatchPaper): PaperHeader {
  return {
    displayName: paper.displayName,
    timeLimitMin: paper.timeLimitMin,
    table: paper.tables[0],
    imageUrl: paper.imageUrl,
    imageWidthPct: paper.imageWidthPct,
  };
}
