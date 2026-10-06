import { revalidateTag, unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { BATTERIES, CATEGORIES, categoryKind } from "./categories";
import { resolveFeatures, type WatchFeatures } from "./types";
import { cohortFromMoments } from "./cohort";
import { tScore } from "./tscore";
import { batteryProgress, clearedBar } from "./progress";
import { STAGES } from "./plan";

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

/**
 * The institute's own figure: the five T-scores added up, over 400, as a
 * mark out of 30. Null until every test has a T-score.
 */
export function scoreOutOf30(tests: { tScore: number | null }[]): number | null {
  if (tests.length === 0 || tests.some((t) => t.tScore === null)) return null;
  const sum = tests.reduce((s, t) => s + (t.tScore as number), 0);
  return Number(((sum / 400) * 30).toFixed(1));
}

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
}

const MOCK_COLUMNS =
  "id, slug, name, paper_ids, gap_min, opens_at, closes_at, max_attempts, cut_off_tscore, is_published, sort_order, created_at";

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
  const { data, error } = await createAdminClient()
    .from("mock_tests")
    .select(MOCK_COLUMNS)
    .order("sort_order")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data as MockRow[]).map(toMock);
}

/** The published mocks, newest first, from the shared cache. */
export async function listPublishedMocks(): Promise<MockTest[]> {
  return unstable_cache(
    async () => {
      const { data, error } = await createAdminClient()
        .from("mock_tests")
        .select(MOCK_COLUMNS)
        .eq("is_published", true)
        .order("sort_order")
        .order("created_at", { ascending: false });
      if (error) return [];
      return (data as MockRow[]).map(toMock);
    },
    ["published-mocks"],
    { tags: [MOCKS_TAG], revalidate: 120 },
  )();
}

/** One mock by slug, with its papers in order. Null when there is none. */
export async function loadMock(slug: string): Promise<{ mock: MockTest; papers: MockPaper[] } | null> {
  const { data, error } = await createAdminClient()
    .from("mock_tests")
    .select(MOCK_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  const mock = toMock(data as MockRow);
  return { mock, papers: await papersOf(mock.paperIds) };
}

/** The papers named, in the order named; a deleted paper is simply absent. */
export async function papersOf(ids: string[]): Promise<MockPaper[]> {
  if (ids.length === 0) return [];
  const supabase = createAdminClient();
  const [{ data: rows }, { data: counts }] = await Promise.all([
    supabase
      .from("watch_papers")
      .select("id, slug, display_name, category, is_published, instruction_time_min, time_limit_min")
      .in("id", ids),
    supabase.from("watch_question_counts").select("paper_id, question_count").in("paper_id", ids),
  ]);
  const count = new Map((counts ?? []).map((c) => [c.paper_id as string, Number(c.question_count)]));
  const byId = new Map((rows ?? []).map((r) => [r.id as string, r]));
  return ids.flatMap((id) => {
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
}

/** The whole sitting's length in minutes: every test's reading and clock, plus the gaps. */
export function mockMinutes(mock: MockTest, papers: MockPaper[]): number {
  const tests = papers.reduce((n, p) => n + p.instructionTimeMin + p.timeLimitMin, 0);
  return tests + Math.max(0, papers.length - 1) * mock.gapMin;
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
  /** 0-based: which test is on. */
  step: number;
  paper: MockPaper;
  /** The attempt each finished test became, in order ("" where none was recorded). */
  attemptIds: string[];
}

/**
 * Stands in the sitting's attempt list for a test that left no attempt
 * (opened and shut unanswered): the column holds uuids, so an empty string
 * cannot.
 */
export const NO_ATTEMPT = "00000000-0000-0000-0000-000000000000";
const isAttempt = (id: string | null | undefined): id is string => Boolean(id) && id !== NO_ATTEMPT;

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

  const { data: mockRow } = await supabase.from("mock_tests").select(MOCK_COLUMNS).eq("id", sitting.mock_id).maybeSingle();
  if (!mockRow) return null;
  const mock = toMock(mockRow as MockRow);
  const papers = await papersOf(mock.paperIds);
  const paper = papers[sitting.step];
  if (!paper) return null;
  return {
    mock,
    papers,
    sittingId: sitting.id,
    startedAt: sitting.started_at,
    step: sitting.step,
    paper,
    attemptIds: (sitting.attempt_ids ?? []).map((id) => id ?? ""),
  };
}

/**
 * The Exam Summary the hall shows in every break: each test of the mock
 * with, for the ones finished, how many questions each of its groups
 * held and how many were answered, and for the rest "yet to attempt".
 * `finished` is how many tests from the start are done.
 */
export async function mockSummary(papers: MockPaper[], attemptIds: string[], finished: number): Promise<MockSummaryTest[]> {
  const supabase = createAdminClient();
  const done = papers.slice(0, finished);
  const ids = done.map((p) => p.id);
  const realAttempts = attemptIds.slice(0, finished).filter(isAttempt);
  const [{ data: rows }, { data: questions }, { data: attempts }] = await Promise.all([
    ids.length
      ? supabase.from("watch_papers").select("id, title, features").in("id", ids)
      : Promise.resolve({ data: [] as { id: string; title: string; features: WatchFeatures | null }[] }),
    ids.length
      ? supabase.from("watch_questions").select("id, paper_id, position").in("paper_id", ids).order("position")
      : Promise.resolve({ data: [] as { id: string; paper_id: string; position: number }[] }),
    realAttempts.length
      ? supabase.from("watch_attempts").select("id, paper_id, responses").in("id", realAttempts)
      : Promise.resolve({ data: [] as { id: string; paper_id: string; responses: Record<string, unknown> | null }[] }),
  ]);
  const rowById = new Map((rows ?? []).map((r) => [r.id as string, r]));
  const attemptById = new Map((attempts ?? []).map((a) => [a.id as string, a]));

  return papers.map((paper, i) => {
    const battery = BATTERIES.find((b) => b.id === paper.battery);
    const title = battery?.title ?? paper.displayName;
    const hindi = battery?.hindi ?? "";
    if (i >= finished) return { battery: paper.battery, title, hindi, status: "pending", rows: [] };

    const row = rowById.get(paper.id);
    const features = resolveFeatures((row?.features ?? {}) as WatchFeatures);
    const qids = (questions ?? []).filter((q) => q.paper_id === paper.id).map((q) => q.id as string);
    const answered = new Set(Object.keys((attemptById.get(attemptIds[i] ?? "")?.responses as Record<string, unknown> | null) ?? {}));
    const ownTitle = (row?.title as string) ?? title;

    // A picture paper is shown in parts, and the hall lists each part as its
    // own group; a Following Directions paper is one group.
    if (categoryKind(paper.category) === "figure") {
      const per = Math.max(1, features.questionsPerPart);
      const parts: string[][] = [];
      for (let at = 0; at < qids.length; at += per) parts.push(qids.slice(at, at + per));
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
  const { count } = await createAdminClient()
    .from("mock_results")
    .select("id", { count: "exact", head: true })
    .eq("mock_id", mockId)
    .eq("user_id", userId);
  return count ?? 0;
}

/**
 * Starts the mock for this candidate, or joins the sitting already open.
 * Refused when the mock is not live or the attempts are spent.
 */
export async function openMockSitting(
  slug: string,
  userId: string,
): Promise<{ ok: true; step: MockStep } | { ok: false; reason: string }> {
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
  // The institute's rule: a Full Mock opens only once every battery in it
  // has reached the pass bar in sectional practice.
  if (!(await mockUnlockedFor(userId, papers))) {
    return { ok: false, reason: `Full Mocks open once every battery is at T-Score: ${STAGES.pass} or above in sectional practice.` };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("mock_sittings")
    .insert({ mock_id: mock.id, user_id: userId })
    .select("id, started_at, step")
    .single();
  if (error) {
    // Two tabs at once: the index refused the loser, so join the winner.
    const again = await currentMockStep(userId);
    if (again && again.mock.id === mock.id) return { ok: true, step: again };
    return { ok: false, reason: error.message };
  }
  return {
    ok: true,
    step: { mock, papers, sittingId: data.id as string, startedAt: data.started_at as string, step: 0, paper: papers[0], attemptIds: [] },
  };
}

/** True once every battery of these papers has passed the bar in sectional practice. */
export async function mockUnlockedFor(userId: string, papers: MockPaper[]): Promise<boolean> {
  const batteries = [...new Set(papers.map((p) => p.battery))];
  if (batteries.length === 0) return false;
  return clearedBar(await batteryProgress(userId), batteries, STAGES.pass);
}

/** How many Full Mocks this candidate finished today (India). */
export async function mocksFinishedToday(userId: string, dayStartIso: string): Promise<number> {
  const { count } = await createAdminClient()
    .from("mock_results")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("submitted_at", dayStartIso);
  return count ?? 0;
}

/**
 * Moves the candidate's mock on from the test just submitted: records which
 * attempt that test became, then either opens the next test or, after the
 * last, writes the scorecard. Returns where the browser should go next.
 */
export async function advanceMock(
  userId: string,
  paperDbId: string,
): Promise<
  | { next: "paper"; slug: string; gapSec: number; step: number; total: number; summary: MockSummaryTest[] }
  | { next: "done"; slug: string; summary: MockSummaryTest[] }
  | null
> {
  const current = await currentMockStep(userId);
  if (!current || current.paper.id !== paperDbId) return null;
  const supabase = createAdminClient();

  // The attempt this test became: the newest one of this paper by this
  // candidate since the mock began. None means the paper was not recorded
  // (opened and shut unanswered): it then counts as zero.
  const { data: attempt } = await supabase
    .from("watch_attempts")
    .select("id")
    .eq("paper_id", paperDbId)
    .eq("user_id", userId)
    .gte("submitted_at", current.startedAt)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: row } = await supabase
    .from("mock_sittings")
    .select("attempt_ids, step")
    .eq("id", current.sittingId)
    .maybeSingle();
  const ids = [...((row?.attempt_ids as string[] | null) ?? [])];
  ids[current.step] = attempt?.id ?? NO_ATTEMPT;

  const last = current.step >= current.papers.length - 1;
  if (!last) {
    const { error } = await supabase
      .from("mock_sittings")
      .update({ attempt_ids: ids, step: current.step + 1, step_started_at: new Date().toISOString() })
      .eq("id", current.sittingId)
      .is("submitted_at", null);
    if (error) throw new Error(error.message);
    return {
      next: "paper",
      slug: current.papers[current.step + 1].slug,
      gapSec: current.mock.gapMin * 60,
      step: current.step + 1,
      total: current.papers.length,
      summary: await mockSummary(current.papers, ids, current.step + 1),
    };
  }

  await finishMock(current, ids);
  return { next: "done", slug: current.mock.slug, summary: await mockSummary(current.papers, ids, current.papers.length) };
}

/** Writes the scorecard and closes the sitting. */
async function finishMock(current: MockStep, attemptIds: string[]): Promise<void> {
  const supabase = createAdminClient();
  const { mock, papers } = current;

  const realIds = attemptIds.filter(isAttempt);
  const [{ data: attempts }, { data: cohorts }, { data: settings }] = await Promise.all([
    realIds.length
      ? supabase.from("watch_attempts").select("id, paper_id, marks, total, attempted, duration_sec").in("id", realIds)
      : Promise.resolve({ data: [] as { id: string; paper_id: string; marks: number; total: number; attempted: number; duration_sec: number | null }[] }),
    supabase.rpc("watch_cohorts", { p_papers: papers.map((p) => p.id) }),
    supabase.from("watch_papers").select("id, stats_min_attempts, reference_mean, reference_sd").in("id", papers.map((p) => p.id)),
  ]);
  const attemptById = new Map((attempts ?? []).map((a) => [a.id as string, a]));
  const settingById = new Map((settings ?? []).map((s) => [s.id as string, s]));

  let durationSec = 0;
  const tests: MockTestResult[] = papers.map((paper, i) => {
    const attempt = attemptById.get(attemptIds[i] ?? "");
    const marks = attempt ? Number(attempt.marks) : 0;
    const total = attempt ? Number(attempt.total) : paper.questionCount;
    durationSec += attempt?.duration_sec ? Number(attempt.duration_sec) : 0;
    // The cohort over the paper's current length, as the result page uses.
    const cohortRow = (cohorts as { paper_id: string; total: number; n: number; mean: number; sd: number }[] | null)?.find(
      (c) => c.paper_id === paper.id && Number(c.total) === total,
    );
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
  await supabase
    .from("mock_sittings")
    .update({ attempt_ids: attemptIds, submitted_at: new Date().toISOString() })
    .eq("id", current.sittingId);
}

/** Gives up on an open sitting: it is closed with no scorecard and no attempt spent. */
export async function abandonMock(userId: string): Promise<void> {
  await createAdminClient()
    .from("mock_sittings")
    .update({ submitted_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("submitted_at", null);
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
  const { data, error } = await supabase
    .from("mock_results")
    .select(RESULT_COLUMNS)
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false })
    .limit(limit);
  if (error || !data?.length) return [];
  const ids = [...new Set(data.map((r) => r.mock_id as string))];
  const { data: mocks } = await supabase.from("mock_tests").select("id, name, slug").in("id", ids);
  const byId = new Map((mocks ?? []).map((m) => [m.id as string, m]));
  return (data as ResultRow[]).map((r) => ({
    ...toResult(r),
    mockName: (byId.get(r.mock_id)?.name as string) ?? "A deleted mock",
    mockSlug: (byId.get(r.mock_id)?.slug as string) ?? "",
  }));
}

/** The newest result of one mock by one candidate. */
export async function latestMockResult(mockId: string, userId: string): Promise<MockResult | null> {
  const { data } = await createAdminClient()
    .from("mock_results")
    .select(RESULT_COLUMNS)
    .eq("mock_id", mockId)
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? toResult(data as ResultRow) : null;
}

/**
 * Where a composite stands among everyone who sat the mock: one entry per
 * candidate, their best. Rank 1 is the best; equal composites share a rank.
 */
export async function mockStanding(mockId: string, userId: string): Promise<{ rank: number; outOf: number } | null> {
  const best = await bestComposites(mockId);
  const mine = best.get(userId);
  if (mine === undefined) return null;
  let better = 0;
  for (const [, c] of best) if (c > mine) better++;
  return { rank: better + 1, outOf: best.size };
}

/** Each candidate's best composite of this mock. */
async function bestComposites(mockId: string): Promise<Map<string, number>> {
  const best = new Map<string, number>();
  const { data } = await createAdminClient()
    .from("mock_results")
    .select("user_id, composite")
    .eq("mock_id", mockId)
    .not("composite", "is", null)
    .not("user_id", "is", null)
    .limit(100000);
  for (const r of data ?? []) {
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

/** The top of a mock's table, with names. */
export async function mockLeaderboard(mockId: string, limit = 10): Promise<LeaderRow[]> {
  const best = await bestComposites(mockId);
  const sorted = [...best.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  if (sorted.length === 0) return [];
  const { data: profiles } = await createAdminClient()
    .from("profiles")
    .select("id, full_name")
    .in("id", sorted.map(([u]) => u));
  const name = new Map((profiles ?? []).map((p) => [p.id as string, (p.full_name as string) || "Candidate"]));
  let rank = 0;
  let last: number | null = null;
  return sorted.map(([userId, composite], i) => {
    if (last === null || composite < last) rank = i + 1;
    last = composite;
    return { userId, name: name.get(userId) ?? "Candidate", composite, rank };
  });
}

/** Every result of a mock, for the panel's table. */
export async function mockResultsOf(mockId: string): Promise<MockResult[]> {
  const { data, error } = await createAdminClient()
    .from("mock_results")
    .select(RESULT_COLUMNS)
    .eq("mock_id", mockId)
    .order("composite", { ascending: false, nullsFirst: false })
    .order("submitted_at", { ascending: false })
    .limit(100000);
  if (error) return [];
  return (data as ResultRow[]).map(toResult);
}
