import { fetchAll } from "./cohort";
import { revalidateTag, unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { accessFor, canSitMock } from "@/lib/packages";
import { BATTERIES, CATEGORIES, categoryKind, hallPosition } from "./categories";
import { resolveFeatures, type WatchFeatures } from "./types";
import { cohortFromMoments } from "./cohort";
import { tScore } from "./tscore";
import { inSittingOrder, sittingOrder } from "./shuffle";
import { PAPERS_TAG } from "./db";
import { missingFunction } from "./session";

/**
 * Full Mock tests: five published papers, one per battery, sat in the
 * hall's order as one sitting — Test 1 to Test 5, each with its own
 * instruction screen and clock, a short gap between them, and one
 * scorecard at the end with every battery's T-score, the composite, and
 * whether every battery cleared the bar.
 *
 * The papers stay what they are; a mock only names them in order. Each
 * test is sat through the paper's own exam screen and recorded as the
 * paper's own attempt, so a mock changes nothing about how a paper works.
 * The mock's sitting keeps which test the candidate is on; the result
 * keeps the five attempts' figures as they stood when the last test ended.
 */

export interface MockTest {
  id: string;
  slug: string;
  name: string;
  /** The papers in order, Test 1 first. */
  paperIds: string[];
  gapMin: number;
  opensAt: string | null;
  closesAt: string | null;
  maxAttempts: number | null;
  cutOffT: number;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  /** Open to every signed-in student, no package needed. */
  isFree: boolean;
  /** Which exam's series the mock belongs to. */
  exam: string;
}

export interface MockPaper {
  id: string;
  slug: string;
  displayName: string;
  category: string;
  battery: number;
  isPublished: boolean;
  questionCount: number;
  instructionTimeMin: number;
  timeLimitMin: number;
}

export type MockStatus = "draft" | "scheduled" | "live" | "closed";

/** One test's line on the scorecard, as stored with the result. */
export interface MockTestResult {
  paperId: string;
  slug: string;
  name: string;
  battery: number;
  marks: number;
  total: number;
  attempted: number;
  /** Null when no cohort or reference figures existed to measure against. */
  tScore: number | null;
  cohortCount: number;
  /** Null when the T-score could not be judged. */
  cleared: boolean | null;
}

export interface MockResult {
  id: string;
  mockId: string;
  userId: string | null;
  tests: MockTestResult[];
  composite: number | null;
  qualified: boolean | null;
  durationSec: number | null;
  submittedAt: string;
}

/** The mark out of 30 lives with the T-score, in tscore.ts; kept here for its readers. */
export { scoreOutOf30 } from "./tscore";

const MOCKS_TAG = "mocks";

export function mocksChanged(): void {
  revalidateTag(MOCKS_TAG);
}

interface MockRow {
  id: string;
  slug: string;
  name: string;
  paper_ids: string[] | null;
  gap_min: number;
  opens_at: string | null;
  closes_at: string | null;
  max_attempts: number | null;
  cut_off_tscore: number | string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  is_free?: boolean | null;
  exam?: string | null;
}

const MOCK_COLUMNS = "id, slug, name, paper_ids, gap_min, opens_at, closes_at, max_attempts, cut_off_tscore, is_published, sort_order, created_at, is_free, exam";
/** The same columns on a database the packages SQL has not reached yet. */
const MOCK_COLUMNS_OLD = MOCK_COLUMNS.replace(", is_free, exam", "");

/** Reads mocks with the package columns, or without them on an older database. */
async function selectMocks(
  shape: (q: ReturnType<ReturnType<ReturnType<typeof createAdminClient>["from"]>["select"]>) => PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<{ data: MockRow[] | null; error: { message: string } | null }> {
  const first = await shape(createAdminClient().from("mock_tests").select(MOCK_COLUMNS));
  if (!first.error) return first as { data: MockRow[] | null; error: null };
  if (!/is_free|exam/i.test(first.error.message)) return first as { data: MockRow[] | null; error: { message: string } };
  const second = await shape(createAdminClient().from("mock_tests").select(MOCK_COLUMNS_OLD));
  return second as { data: MockRow[] | null; error: { message: string } | null };
}

function toMock(row: MockRow): MockTest {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    paperIds: row.paper_ids ?? [],
    gapMin: Number(row.gap_min ?? 1),
    opensAt: row.opens_at,
    closesAt: row.closes_at,
    maxAttempts: row.max_attempts ?? null,
    cutOffT: Number(row.cut_off_tscore ?? 42),
    isPublished: row.is_published,
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: row.created_at,
    isFree: row.is_free === true,
    exam: row.exam ?? "alp",
  };
}

/** Draft, not open yet, open now, or over — by the clock. */
export function mockStatus(mock: MockTest, now = Date.now()): MockStatus {
  if (!mock.isPublished) return "draft";
  if (mock.opensAt && new Date(mock.opensAt).getTime() > now) return "scheduled";
  if (mock.closesAt && new Date(mock.closesAt).getTime() < now) return "closed";
  return "live";
}

/** Every mock, for the panel. Empty on a database without the table. */
export async function listMocksForAdmin(): Promise<MockTest[]> {
  const { data, error } = await selectMocks((q) => q.order("sort_order").order("created_at", { ascending: false }));
  if (error) return [];
  return (data as MockRow[]).map(toMock);
}

/** The published mocks, newest first, from the shared cache. */
export async function listPublishedMocks(): Promise<MockTest[]> {
  return unstable_cache(
    async () => {
      const { data, error } = await selectMocks((q) => q.eq("is_published", true).order("sort_order").order("created_at", { ascending: false }));
      if (error) return [];
      return (data as MockRow[]).map(toMock);
    },
    ["published-mocks"],
    { tags: [MOCKS_TAG], revalidate: 120 },
  )();
}

/** One mock by slug, with its papers in order, from the shared cache. Null when there is none. */
export async function loadMock(slug: string): Promise<{ mock: MockTest; papers: MockPaper[] } | null> {
  return mockWithPapers("slug", slug);
}

/**
 * A mock and its papers, by slug or by id, from the shared cache: every
 * page of a sitting (the test, its result, the break, the dashboard) asks
 * for them, and they change only when the admin saves the mock or a
 * paper, which empties the cache. Three reads a view become none.
 */
async function mockWithPapers(by: "slug" | "id", key: string): Promise<{ mock: MockTest; papers: MockPaper[] } | null> {
  return unstable_cache(
    async () => {
      const { data, error } = await selectMocks((q) => q.eq(by, key).maybeSingle());
      if (error) throw new Error(error.message);
      if (!data) return null;
      const mock = toMock(data as unknown as MockRow);
      // A failed read of the papers is thrown, never kept: a cached mock
      // with no papers, or with none ready, would shut the mock for every
      // candidate on it until the cache turned over.
      const read = await readMockPapers(mock.paperIds);
      if (!read.ok) throw new Error("Could not read the mock's papers");
      return { mock, papers: read.papers };
    },
    ["mock-with-papers", by, key],
    { tags: [MOCKS_TAG, PAPERS_TAG], revalidate: 120 },
  )();
}

/** The papers named, in the hall's order; a deleted paper is simply absent. */
export async function papersOf(ids: string[]): Promise<MockPaper[]> {
  return (await readMockPapers(ids)).papers;
}

/** So many ids to a read: they travel in the request's address, which has a limit. */
const IDS_PER_READ = 300;

/**
 * The papers named, in the hall's order, and whether every read came
 * back. A deleted paper is simply absent; a read that failed leaves the
 * papers it would have held absent too, and `ok` false, so a caller that
 * caches can refuse to keep the gap.
 */
async function readMockPapers(ids: string[]): Promise<{ papers: MockPaper[]; ok: boolean }> {
  if (ids.length === 0) return { papers: [], ok: true };
  const supabase = createAdminClient();
  const chunks: string[][] = [];
  for (let at = 0; at < ids.length; at += IDS_PER_READ) chunks.push(ids.slice(at, at + IDS_PER_READ));
  const reads = await Promise.all(
    chunks.map((chunk) =>
      Promise.all([
        supabase.from("watch_papers").select("id, slug, display_name, category, is_published, instruction_time_min, time_limit_min").in("id", chunk),
        supabase.from("watch_question_counts").select("paper_id, question_count").in("paper_id", chunk),
      ]),
    ),
  );
  const ok = reads.every(([a, b]) => !a.error && !b.error);
  const rows = reads.flatMap(([a]) => a.data ?? []);
  const counts = reads.flatMap(([, b]) => b.data ?? []);
  const count = new Map(counts.map((c) => [c.paper_id as string, Number(c.question_count)]));
  const byId = new Map(rows.map((r) => [r.id as string, r]));
  const named = ids.flatMap((id) => {
    const r = byId.get(id);
    if (!r) return [];
    const category = (r.category as string) ?? "watch";
    return [
      {
        id: r.id as string,
        slug: r.slug as string,
        displayName: r.display_name as string,
        category,
        battery: CATEGORIES.find((c) => c.id === category)?.battery ?? 2,
        isPublished: Boolean(r.is_published),
        questionCount: count.get(id) ?? 0,
        instructionTimeMin: Number(r.instruction_time_min ?? 0),
        timeLimitMin: Number(r.time_limit_min ?? 0),
      },
    ];
  });
  // A mock sits its papers in the hall's order, whatever order they were
  // named in: a mock made before the order was known follows it too.
  return { papers: named.map((p, i) => [p, i] as const).sort((a, b) => hallPosition(a[0].battery) - hallPosition(b[0].battery) || a[1] - b[1]).map(([p]) => p), ok };
}

/** The whole sitting's length in minutes: every test's reading and clock, plus the gaps. */
export function mockMinutes(mock: MockTest, papers: MockPaper[]): number {
  const tests = papers.reduce((n, p) => n + p.instructionTimeMin + p.timeLimitMin, 0);
  return tests + Math.max(0, papers.length - 1) * mock.gapMin;
}

/** What a mock comes to: its tests' questions together, and the whole sitting's minutes. */
export interface MockSize {
  questions: number;
  minutes: number;
}

/**
 * The size of every mock listed, by mock id, in two reads for the lot
 * rather than two per mock, from the shared cache: the list page shows
 * each mock's questions and minutes beside its name.
 */
export async function mockSizes(mocks: MockTest[]): Promise<Map<string, MockSize>> {
  const ids = [...new Set(mocks.flatMap((m) => m.paperIds))].sort();
  if (ids.length === 0) return new Map();
  const sizes = await unstable_cache(
    async () => {
      // A failed read is thrown, never kept: a cached "no questions" would
      // blank every mock's line for five minutes.
      const read = await readMockPapers(ids);
      if (!read.ok) throw new Error("Could not read the mocks' papers");
      const papers = new Map(read.papers.map((p) => [p.id, p]));
      return mocks.map((mock) => {
        const own = mock.paperIds.flatMap((id) => papers.get(id) ?? []);
        return [mock.id, { questions: own.reduce((n, p) => n + p.questionCount, 0), minutes: mockMinutes(mock, own) }] as const;
      });
    },
    ["mock-sizes", ids.join(","), mocks.map((m) => `${m.id}:${m.gapMin}:${m.paperIds.join("+")}`).join("|")],
    // Emptied when a mock changes and when any paper does: the counts and
    // clocks are the papers' own.
    { tags: [MOCKS_TAG, PAPERS_TAG], revalidate: 300 },
  )();
  return new Map(sizes);
}

// ---------------------------------------------------------------------------
// Sittings
// ---------------------------------------------------------------------------

interface SittingRow {
  id: string;
  mock_id: string;
  user_id: string;
  started_at: string;
  step: number;
  step_started_at: string;
  attempt_ids: string[] | null;
  submitted_at: string | null;
}

export interface MockStep {
  mock: MockTest;
  papers: MockPaper[];
  sittingId: string;
  startedAt: string;
  /** 0-based: where the test on now stands in the papers. */
  step: number;
  paper: MockPaper;
  /** The attempts the finished tests became, as recorded; a test that left none is marked by its paper's id. */
  attemptIds: string[];
  /** The papers already sat in this sitting. */
  done: string[];
}

/**
 * Stood in the sitting's attempt list for a test that left no attempt
 * (opened and shut unanswered) before such a test was marked by its own
 * paper's id: the column holds uuids, so an empty string cannot. Read
 * for the sittings that still carry it; never written any more.
 */
export const NO_ATTEMPT = "00000000-0000-0000-0000-000000000000";
const isAttempt = (id: string | null | undefined): id is string => Boolean(id) && id !== NO_ATTEMPT;

/**
 * The papers a sitting has finished: those an attempt in its list is of,
 * and those its list names outright (a test that left no attempt). The
 * sitting is paired with its papers by id, not by position, so the mock's
 * papers may be re-ordered under it (the hall's order came in after some
 * mocks were made) and a test is never sat twice or skipped.
 */
function papersDone(papers: MockPaper[], attemptIds: string[], attempts: { paper_id: string }[], namedIds: string[]): Set<string> {
  const paperIds = new Set(papers.map((p) => p.id));
  // The papers as the mock named them: the order an older sitting's
  // markers were written against, before the hall's order sorted the list.
  const named = namedIds.filter((id) => paperIds.has(id));
  const done = new Set<string>();
  attemptIds.forEach((id, i) => {
    if (!id) return;
    if (paperIds.has(id)) done.add(id);
    // An older sitting marked the slot alone: the paper in that place then.
    else if (id === NO_ATTEMPT && named[i]) done.add(named[i]);
  });
  attempts.forEach((a) => done.add(a.paper_id));
  return done;
}

/** The attempt ids in a sitting's list: not the markers, not a paper's own id. */
function attemptIdsIn(attemptIds: string[], papers: MockPaper[]): string[] {
  const paperIds = new Set(papers.map((p) => p.id));
  return attemptIds.filter((id) => isAttempt(id) && !paperIds.has(id));
}

/** One test of a mock as the break screen's Exam Summary lists it. */
export interface MockSummaryTest {
  battery: number;
  title: string;
  hindi: string;
  /** Finished tests carry their groups' counts; the rest are yet to attempt. */
  status: "done" | "pending";
  rows: { name: string; total: number; answered: number }[];
}

/**
 * The mock a candidate is in the middle of, if any: the open sitting and
 * the test it is on. The exam page and the result page ask this to know
 * whether a paper is being sat as part of a mock.
 */
export async function currentMockStep(userId: string): Promise<MockStep | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("mock_sittings")
    .select("id, mock_id, user_id, started_at, step, step_started_at, attempt_ids, submitted_at")
    .eq("user_id", userId)
    .is("submitted_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const sitting = data as SittingRow;

  const loaded = await mockWithPapers("id", sitting.mock_id).catch(() => null);
  if (!loaded) return null;
  const { mock, papers } = loaded;
  const attemptIds = (sitting.attempt_ids ?? []).map((id) => id ?? "");
  const realIds = attemptIdsIn(attemptIds, papers);
  const { data: attempts, error: attemptsError } = realIds.length
    ? await supabase.from("watch_attempts").select("id, paper_id").in("id", realIds)
    : { data: [] as { id: string; paper_id: string }[], error: null };
  // A read that failed must not pass for "nothing sat yet".
  if (attemptsError) throw new Error(attemptsError.message);
  const done = papersDone(papers, attemptIds, (attempts ?? []) as { paper_id: string }[], mock.paperIds);
  // The test on now: the first paper not yet sat, in the hall's order.
  const paper = papers.find((p) => !done.has(p.id));
  if (!paper) return null;
  return {
    mock,
    papers,
    sittingId: sitting.id,
    startedAt: sitting.started_at,
    step: papers.indexOf(paper),
    paper,
    attemptIds,
    done: [...done],
  };
}

/**
 * The Exam Summary the hall shows in every break: each test of the mock
 * with, for the ones finished, how many questions each of its groups
 * held and how many were answered, and for the rest "yet to attempt".
 * `finished` is how many tests from the start are done.
 */
export async function mockSummary(papers: MockPaper[], attemptIds: string[], namedIds: string[]): Promise<MockSummaryTest[]> {
  const supabase = createAdminClient();
  const realAttempts = attemptIdsIn(attemptIds, papers);
  const { data: attempts, error } = realAttempts.length
    ? await supabase.from("watch_attempts").select("id, paper_id, user_id, responses").in("id", realAttempts)
    : { data: [] as { id: string; paper_id: string; user_id: string; responses: Record<string, unknown> | null }[], error: null };
  if (error) throw new Error(error.message);
  const done = papersDone(papers, attemptIds, (attempts ?? []) as { paper_id: string }[], namedIds);
  const ids = papers.filter((p) => done.has(p.id)).map((p) => p.id);
  // The candidate's finished sittings of these papers, newest first: a
  // paper with its shuffle switch on was sat in its sitting's own order,
  // and its parts are counted in that order (lib/wt/shuffle.ts).
  const userId = (attempts ?? [])[0]?.user_id as string | undefined;
  const [{ data: rows }, { data: questions }, { data: sittings }] = await Promise.all([
    ids.length ? supabase.from("watch_papers").select("id, title, features").in("id", ids) : Promise.resolve({ data: [] as { id: string; title: string; features: WatchFeatures | null }[] }),
    ids.length ? supabase.from("watch_questions").select("id, paper_id, position").in("paper_id", ids).order("position") : Promise.resolve({ data: [] as { id: string; paper_id: string; position: number }[] }),
    ids.length && userId
      ? supabase.from("watch_sessions").select("id, paper_id").in("paper_id", ids).eq("user_id", userId).not("submitted_at", "is", null).order("submitted_at", { ascending: false })
      : Promise.resolve({ data: [] as { id: string; paper_id: string }[] }),
  ]);
  const rowById = new Map((rows ?? []).map((r) => [r.id as string, r]));
  const attemptByPaper = new Map((attempts ?? []).map((a) => [a.paper_id as string, a]));
  const sittingByPaper = new Map<string, string>();
  for (const s of sittings ?? []) if (!sittingByPaper.has(s.paper_id as string)) sittingByPaper.set(s.paper_id as string, s.id as string);

  return papers.map((paper) => {
    const battery = BATTERIES.find((b) => b.id === paper.battery);
    const title = battery?.title ?? paper.displayName;
    const hindi = battery?.hindi ?? "";
    if (!done.has(paper.id)) return { battery: paper.battery, title, hindi, status: "pending", rows: [] };

    const row = rowById.get(paper.id);
    const features = resolveFeatures((row?.features ?? {}) as WatchFeatures);
    const qids = (questions ?? []).filter((q) => q.paper_id === paper.id).map((q) => q.id as string);
    const answered = new Set(Object.keys((attemptByPaper.get(paper.id)?.responses as Record<string, unknown> | null) ?? {}));
    // The hall names the group by the battery, whatever the paper was called.
    const ownTitle = title;

    // A picture paper is shown in parts, and the hall lists each part as its
    // own group; a Following Directions paper is one group.
    if (categoryKind(paper.category) === "figure") {
      const per = Math.max(1, features.questionsPerPart);
      const sittingId = sittingByPaper.get(paper.id);
      const sat = features.shuffleQuestions && sittingId ? inSittingOrder(qids, sittingOrder(qids.length, paper.category, features, sittingId)) : qids;
      const parts: string[][] = [];
      for (let at = 0; at < sat.length; at += per) parts.push(sat.slice(at, at + per));
      if (parts.length === 0) parts.push([]);
      const scheduled = features.studyTimeMin > 0;
      return {
        battery: paper.battery,
        title,
        hindi,
        status: "done",
        rows: parts.map((group, n) => ({
          name: scheduled ? `${ownTitle} (Part ${n + 1})` : `Part${n + 1}_`,
          total: group.length,
          answered: group.filter((id) => answered.has(id)).length,
        })),
      };
    }
    return {
      battery: paper.battery,
      title,
      hindi,
      status: "done",
      rows: [{ name: ownTitle, total: qids.length, answered: qids.filter((id) => answered.has(id)).length }],
    };
  });
}

/** How many times this candidate has finished this mock. */
export async function mockAttemptsUsed(mockId: string, userId: string): Promise<number> {
  const { count } = await createAdminClient().from("mock_results").select("id", { count: "exact", head: true }).eq("mock_id", mockId).eq("user_id", userId);
  return count ?? 0;
}

/**
 * Starts the mock for this candidate, or joins the sitting already open.
 * Refused when the mock is not live or the attempts are spent.
 */
export async function openMockSitting(slug: string, userId: string, role = "student"): Promise<{ ok: true; step: MockStep } | { ok: false; reason: string }> {
  const loaded = await loadMock(slug);
  if (!loaded || !loaded.mock.isPublished) return { ok: false, reason: "This mock is not available." };
  const { mock, papers } = loaded;

  const existing = await currentMockStep(userId);
  if (existing && existing.mock.id === mock.id) return { ok: true, step: existing };
  if (existing) {
    return { ok: false, reason: `You are in the middle of ${existing.mock.name}. Finish it first.` };
  }

  const status = mockStatus(mock);
  if (status === "scheduled") return { ok: false, reason: "This mock has not opened yet." };
  if (status === "closed") return { ok: false, reason: "This mock is over." };
  if (papers.length === 0 || papers.some((p) => !p.isPublished || p.questionCount === 0)) {
    return { ok: false, reason: "This mock's papers are not ready yet. Ask at the institute." };
  }
  if (mock.maxAttempts !== null && (await mockAttemptsUsed(mock.id, userId)) >= mock.maxAttempts) {
    return { ok: false, reason: "You have used every attempt of this mock." };
  }
  // The mock is in a package, unless it is the free one.
  if (!canSitMock(await accessFor(userId, role), mock)) {
    return { ok: false, reason: "This Full Mock is part of a package. Buy the Full Mock package to sit it." };
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("mock_sittings").insert({ mock_id: mock.id, user_id: userId }).select("id, started_at, step").single();
  if (error) {
    // Two tabs at once: the index refused the loser, so join the winner.
    const again = await currentMockStep(userId);
    if (again && again.mock.id === mock.id) return { ok: true, step: again };
    return { ok: false, reason: error.message };
  }
  return {
    ok: true,
    step: { mock, papers, sittingId: data.id as string, startedAt: data.started_at as string, step: 0, paper: papers[0], attemptIds: [], done: [] },
  };
}


/** How many Full Mocks this candidate finished today (India). */
export async function mocksFinishedToday(userId: string, dayStartIso: string): Promise<number> {
  const { count } = await createAdminClient().from("mock_results").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("submitted_at", dayStartIso);
  return count ?? 0;
}

/**
 * Moves the candidate's mock on from the test just submitted: records which
 * attempt that test became, then either opens the next test or, after the
 * last, writes the scorecard. Returns where the browser should go next.
 */
export async function advanceMock(userId: string, paperDbId: string): Promise<{ next: "paper"; slug: string; gapSec: number; step: number; total: number; summary: MockSummaryTest[] } | { next: "done"; slug: string; summary: MockSummaryTest[] } | null> {
  const current = await currentMockStep(userId);
  // Any test of the mock not yet sat moves it on: the one on now, or one a
  // candidate had open when the mock's order changed under the sitting.
  if (!current || !current.papers.some((p) => p.id === paperDbId) || current.done.includes(paperDbId)) return null;
  const supabase = createAdminClient();

  // The attempt this test became: the newest one of this paper by this
  // candidate since the mock began. None means the paper was not recorded
  // (opened and shut unanswered): it then counts as zero.
  const { data: attempt } = await supabase.from("watch_attempts").select("id").eq("paper_id", paperDbId).eq("user_id", userId).gte("submitted_at", current.startedAt).order("submitted_at", { ascending: false }).limit(1).maybeSingle();

  const { data: row } = await supabase.from("mock_sittings").select("attempt_ids, step").eq("id", current.sittingId).maybeSingle();
  // The attempt joins the list; a test that left none is marked by its paper.
  const ids = [...((row?.attempt_ids as string[] | null) ?? []), attempt?.id ?? paperDbId];

  const remaining = current.papers.filter((p) => !current.done.includes(p.id) && p.id !== paperDbId);
  if (remaining.length > 0) {
    const nextStep = current.papers.indexOf(remaining[0]);
    const { error } = await supabase
      .from("mock_sittings")
      .update({ attempt_ids: ids, step: nextStep, step_started_at: new Date().toISOString() })
      .eq("id", current.sittingId)
      .is("submitted_at", null);
    if (error) throw new Error(error.message);
    return {
      next: "paper",
      slug: remaining[0].slug,
      gapSec: current.mock.gapMin * 60,
      step: nextStep,
      total: current.papers.length,
      summary: await mockSummary(current.papers, ids, current.mock.paperIds),
    };
  }

  await finishMock(current, ids);
  return { next: "done", slug: current.mock.slug, summary: await mockSummary(current.papers, ids, current.mock.paperIds) };
}

/** Writes the scorecard and closes the sitting. */
async function finishMock(current: MockStep, attemptIds: string[]): Promise<void> {
  const supabase = createAdminClient();
  const { mock, papers } = current;

  const realIds = attemptIdsIn(attemptIds, papers);
  const [{ data: attempts }, { data: cohorts }, { data: settings }] = await Promise.all([
    realIds.length
      ? supabase.from("watch_attempts").select("id, paper_id, marks, total, attempted, duration_sec").in("id", realIds)
      : Promise.resolve({ data: [] as { id: string; paper_id: string; marks: number; total: number; attempted: number; duration_sec: number | null }[] }),
    supabase.rpc("watch_cohorts", { p_papers: papers.map((p) => p.id) }),
    supabase
      .from("watch_papers")
      .select("id, stats_min_attempts, reference_mean, reference_sd")
      .in(
        "id",
        papers.map((p) => p.id),
      ),
  ]);
  // Each test's attempt by the paper it was of: the list's order says nothing.
  const attemptByPaper = new Map((attempts ?? []).map((a) => [a.paper_id as string, a]));
  const settingById = new Map((settings ?? []).map((s) => [s.id as string, s]));

  let durationSec = 0;
  const tests: MockTestResult[] = papers.map((paper) => {
    const attempt = attemptByPaper.get(paper.id);
    const marks = attempt ? Number(attempt.marks) : 0;
    const total = attempt ? Number(attempt.total) : paper.questionCount;
    durationSec += attempt?.duration_sec ? Number(attempt.duration_sec) : 0;
    // The cohort over the paper's current length, as the result page uses.
    const cohortRow = (cohorts as { paper_id: string; total: number; n: number; mean: number; sd: number }[] | null)?.find((c) => c.paper_id === paper.id && Number(c.total) === total);
    const moments = cohortRow ? { n: Number(cohortRow.n), mean: Number(cohortRow.mean), sd: Number(cohortRow.sd) } : { n: 0, mean: 0, sd: 0 };
    const setting = settingById.get(paper.id);
    const cohort = cohortFromMoments(moments, {
      stats_min_attempts: setting ? (setting.stats_min_attempts as number | null) : null,
      reference_mean: setting ? (setting.reference_mean as number | null) : null,
      reference_sd: setting ? (setting.reference_sd as number | null) : null,
    });
    const t = tScore(marks, cohort);
    const value = t ? Number(t.value.toFixed(1)) : null;
    return {
      paperId: paper.id,
      slug: paper.slug,
      name: paper.displayName,
      battery: paper.battery,
      marks,
      total,
      attempted: attempt ? Number(attempt.attempted) : 0,
      tScore: value,
      cohortCount: moments.n,
      cleared: value === null ? null : value >= mock.cutOffT,
    };
  });

  const scored = tests.filter((t) => t.tScore !== null);
  const composite = scored.length ? Number((scored.reduce((s, t) => s + (t.tScore as number), 0) / scored.length).toFixed(1)) : null;
  const qualified = tests.some((t) => t.cleared === null) ? null : tests.every((t) => t.cleared === true);

  const { error } = await supabase.from("mock_results").insert({
    mock_id: mock.id,
    user_id: current.sittingId ? (await supabase.from("mock_sittings").select("user_id").eq("id", current.sittingId).single()).data?.user_id : null,
    sitting_id: current.sittingId,
    tests,
    composite,
    qualified,
    duration_sec: durationSec || null,
  });
  if (error) throw new Error(error.message);
  await supabase.from("mock_sittings").update({ attempt_ids: attemptIds, submitted_at: new Date().toISOString() }).eq("id", current.sittingId);
}

/** Gives up on an open sitting: it is closed with no scorecard and no attempt spent. */
export async function abandonMock(userId: string): Promise<void> {
  await createAdminClient().from("mock_sittings").update({ submitted_at: new Date().toISOString() }).eq("user_id", userId).is("submitted_at", null);
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

interface ResultRow {
  id: string;
  mock_id: string;
  user_id: string | null;
  tests: MockTestResult[];
  composite: number | string | null;
  qualified: boolean | null;
  duration_sec: number | null;
  submitted_at: string;
}

function toResult(row: ResultRow): MockResult {
  return {
    id: row.id,
    mockId: row.mock_id,
    userId: row.user_id,
    tests: Array.isArray(row.tests) ? row.tests : [],
    composite: row.composite === null ? null : Number(row.composite),
    qualified: row.qualified,
    durationSec: row.duration_sec,
    submittedAt: row.submitted_at,
  };
}

const RESULT_COLUMNS = "id, mock_id, user_id, tests, composite, qualified, duration_sec, submitted_at";

/** A candidate's own mock results, newest first, with each mock's name. */
export async function mockResultsFor(userId: string, limit = 50): Promise<(MockResult & { mockName: string; mockSlug: string })[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("mock_results").select(RESULT_COLUMNS).eq("user_id", userId).order("submitted_at", { ascending: false }).limit(limit);
  if (error || !data?.length) return [];
  // The names come from the published-mocks cache; only a mock no longer
  // published (or deleted) is looked up, and that is rare.
  const ids = [...new Set(data.map((r) => r.mock_id as string))];
  const byId = new Map<string, { id: string; name: string; slug: string }>((await listPublishedMocks()).filter((m) => ids.includes(m.id)).map((m) => [m.id, { id: m.id, name: m.name, slug: m.slug }]));
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length) {
    const { data: mocks } = await supabase.from("mock_tests").select("id, name, slug").in("id", missing);
    for (const m of mocks ?? []) byId.set(m.id as string, { id: m.id as string, name: m.name as string, slug: m.slug as string });
  }
  return (data as ResultRow[]).map((r) => ({
    ...toResult(r),
    mockName: (byId.get(r.mock_id)?.name as string) ?? "A deleted mock",
    mockSlug: (byId.get(r.mock_id)?.slug as string) ?? "",
  }));
}

/** The newest result of one mock by one candidate. */
export async function latestMockResult(mockId: string, userId: string): Promise<MockResult | null> {
  const { data } = await createAdminClient().from("mock_results").select(RESULT_COLUMNS).eq("mock_id", mockId).eq("user_id", userId).order("submitted_at", { ascending: false }).limit(1).maybeSingle();
  return data ? toResult(data as ResultRow) : null;
}

/**
 * Where a composite stands among everyone who sat the mock: one entry per
 * candidate, their best. Rank 1 is the best; equal composites share a rank.
 * The percentile is the share of candidates strictly below, as the sectional
 * result counts it.
 */
export async function mockStanding(mockId: string, userId: string): Promise<{ rank: number; outOf: number; percentile: number } | null> {
  // Kept for two minutes per candidate: a scorecard reopened a few times
  // after the mock costs one call, not one pass over every result each time.
  return unstable_cache(
    async () => {
      const { data, error } = await createAdminClient().rpc("mock_standing", { p_mock: mockId, p_user: userId });
      if (!error) {
        const row = (data as { rank: number; out_of: number; percentile: number | null }[] | null)?.[0];
        return row ? { rank: Number(row.rank), outOf: Number(row.out_of), percentile: Number(row.percentile ?? 0) } : null;
      }
      if (!missingFunction(error)) throw new Error(error.message);
      // A database without the function yet: the rows, as before.
      const best = await bestComposites(mockId);
      const mine = best.get(userId);
      if (mine === undefined) return null;
      let better = 0;
      let worse = 0;
      for (const [, c] of best) {
        if (c > mine) better++;
        else if (c < mine) worse++;
      }
      return { rank: better + 1, outOf: best.size, percentile: (worse / best.size) * 100 };
    },
    ["mock-standing", mockId, userId],
    { tags: [MOCKS_TAG], revalidate: 120 },
  )();
}

/**
 * Each candidate's best composite of this mock, best first — the top
 * `limit`, or all — worked out by the database (supabase/mock-standing.sql);
 * on a database without the function yet, read from the rows as before.
 */
async function bestComposites(mockId: string, limit?: number): Promise<Map<string, number>> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("mock_best_composites", { p_mock: mockId, p_limit: limit ?? null });
  if (!error) return new Map(((data as { user_id: string; composite: number | string }[] | null) ?? []).map((r) => [r.user_id, Number(r.composite)]));
  if (!missingFunction(error)) throw new Error(error.message);
  const best = new Map<string, number>();
  const rows = await fetchAll<{ user_id: string | null; composite: number | string | null }>((from, to) =>
    supabase.from("mock_results").select("user_id, composite").eq("mock_id", mockId).not("composite", "is", null).not("user_id", "is", null).order("id").range(from, to),
  );
  for (const r of rows) {
    const c = Number(r.composite);
    const u = r.user_id as string;
    if (!best.has(u) || (best.get(u) as number) < c) best.set(u, c);
  }
  return best;
}

export interface LeaderRow {
  userId: string;
  name: string;
  composite: number;
  rank: number;
}

/** The top of a mock's table, with names, kept for two minutes: the same for everyone who looks. */
export async function mockLeaderboard(mockId: string, limit = 10): Promise<LeaderRow[]> {
  return unstable_cache(
    async () => {
      const best = await bestComposites(mockId, limit);
      const sorted = [...best.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
      if (sorted.length === 0) return [];
      const { data: profiles } = await createAdminClient()
        .from("profiles")
        .select("id, full_name")
        .in(
          "id",
          sorted.map(([u]) => u),
        );
      const name = new Map((profiles ?? []).map((p) => [p.id as string, (p.full_name as string) || "Candidate"]));
      let rank = 0;
      let last: number | null = null;
      return sorted.map(([userId, composite], i) => {
        if (last === null || composite < last) rank = i + 1;
        last = composite;
        return { userId, name: name.get(userId) ?? "Candidate", composite, rank };
      });
    },
    ["mock-leaderboard", mockId, String(limit)],
    { tags: [MOCKS_TAG], revalidate: 120 },
  )();
}

/** Every result of a mock, for the panel's table. */
export async function mockResultsOf(mockId: string): Promise<MockResult[]> {
  const supabase = createAdminClient();
  try {
    const data = await fetchAll<ResultRow>((from, to) =>
      supabase.from("mock_results").select(RESULT_COLUMNS).eq("mock_id", mockId).order("composite", { ascending: false, nullsFirst: false }).order("submitted_at", { ascending: false }).order("id").range(from, to),
    );
    return data.map(toResult);
  } catch {
    return [];
  }
}
