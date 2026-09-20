import { NextResponse } from "next/server";
import { getProfile, isConfigured, isVerifiedEditor } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBundledPaper } from "@/lib/wt/paper";
import { tScore, type Cohort } from "@/lib/wt/tscore";
import {
  resolveFeatures,
  resolveResultView,
  type ResultView,
  type WatchFeatures,
} from "@/lib/wt/types";
import { closeExpiredSitting, closeSitting, lastSubmission } from "@/lib/wt/session";
import { decideCutOff, type CutOffVerdict } from "@/lib/wt/cutoff";
import { MAX_OPTION } from "@/lib/wt/parse-questions";
import {
  aggregateFromRows,
  cohortFromMoments,
  fetchAll,
  momentsFromAggregate,
  standingFromAggregate,
  type AttemptMark,
  type CohortAggregate,
} from "@/lib/wt/cohort";

/**
 * Scores an attempt on the server.
 *
 * The answer key must never reach a candidate's browser: otherwise anyone can
 * open the result page in a second tab, read the page source and copy every
 * answer back into the running test. So this route looks the key up with the
 * service-role client, and only the marked-up result goes back.
 *
 * Three rules keep that true, and each one exists because without it the key
 * leaked in practice:
 *
 *  - Only a signed-in candidate is answered at all. Anonymous posts used to be
 *    marked in full, key included, for any paper by slug.
 *  - A paper is marked ONLY once its sitting is closed. The submit that closes
 *    the sitting is marked; any later call is shown the answers the server
 *    kept at that moment. Marking whatever answers a browser sent up, at any
 *    time, was an oracle: five posts — every question set to each of the five
 *    options in turn — read the whole key off the per-question verdicts,
 *    even with the "show correct answers" switch off.
 *  - Drafts are not marked for candidates. Slugs are guessable, and an
 *    unpublished paper's key is exactly the one the institute has not
 *    released yet.
 */

interface Body {
  paperId?: unknown;
  answers?: unknown;
  /** True on the submit that ends the attempt; false when merely reviewing. */
  record?: unknown;
}

export interface MarkedQuestion {
  id: string;
  position: number;
  promptEn: string;
  promptHi: string;
  options: number[];
  given: number | null;
  /** The answer key. Absent on the wire unless the paper publishes it. */
  correct?: number;
  /** The verdict on this question. Stays even when the key is withheld. */
  isCorrect: boolean;
  /** The worked solution spells the answer out, so it travels with the key. */
  workingEn?: string;
  workingHi?: string;
  topic: string;
}

export interface TopicRow {
  topic: string;
  total: number;
  attempted: number;
  correct: number;
  accuracy: number;
}

export interface Standing {
  /** 1 is the best mark in the cohort. Equal marks share a rank. */
  rank: number;
  outOf: number;
  /** Share of the cohort this candidate did better than, as a percentage. */
  percentile: number;
}

/**
 * The standing as it travels to the browser: only the halves the paper
 * publishes. Gating the object as a whole let a switched-off rank ride along
 * with a switched-on percentile.
 */
export type StandingWire = Partial<Standing>;

export type CutOff = CutOffVerdict;

/** One earlier attempt of this paper by this candidate, for the trend line. */
export interface HistoryPoint {
  at: number;
  marks: number;
  total: number;
  attempted: number;
  durationSec: number | null;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }

  const paperId = typeof body.paperId === "string" ? body.paperId : "";
  if (!paperId) {
    return NextResponse.json({ error: "paperId is required" }, { status: 400 });
  }

  const given = toAnswers(body.answers);
  const wantsRecord = body.record === true;

  // No database: the bundled sample only, whose key ships in the bundle.
  if (!isConfigured()) {
    const marked = markFromBundle(paperId, given);
    if (!marked) return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    return NextResponse.json(respond(marked, null, null));
  }

  const [profile, paper] = await Promise.all([getProfile(), fetchPaperRow(paperId)]);

  if (!profile) {
    return NextResponse.json({ error: "Sign in to see your result" }, { status: 401 });
  }
  // The role alone is not enough for what follows — a draft's questions, a
  // marking with no sitting behind it. Only the admin who passed the second
  // factor in this session (an admin, or an editor) gets more than a student.
  const admin = await isVerifiedEditor();

  // With a database, every paper is in it. The bundled sample is not served
  // alongside: it has no sitting, no record, and marking it on demand would
  // hand out its key.
  if (!paper) return NextResponse.json({ error: "Paper not found" }, { status: 404 });

  if (!paper.is_published && !admin) {
    return NextResponse.json({ error: "Paper not found" }, { status: 404 });
  }

  const instructionSec = (paper.instruction_time_min ?? 0) * 60;
  const limitSec = (paper.time_limit_min ?? 0) * 60;
  const pauseAllowed = resolveFeatures(paper.features ?? undefined).allowPause;

  // The questions do not depend on which answers are marked, so they are
  // fetched while the sitting is being closed rather than after it.
  const [rows, closed] = await Promise.all([
    fetchQuestions(paper.id),
    wantsRecord
      ? closeSitting(
          paper.id,
          profile.id,
          instructionSec,
          limitSec,
          Object.fromEntries(given),
          !pauseAllowed,
        )
      : Promise.resolve(null),
  ]);

  // Which answers this call marks, and whether it records an attempt.
  //
  // Closing the sitting is what makes an attempt real, and it is the one
  // moment the browser's answers are taken: they are stored with the sitting
  // and every later visit is marked from that copy. A null from closeSitting
  // means there was no open sitting — a reload, a second tab arriving late, a
  // bare post — and none of them may add another attempt or pick the answers.
  let answers = given;
  let record = false;
  let durationSec: number | null = null;

  if (closed) {
    durationSec = closed.durationSec;
    // A sitting that never reached the questions, with nothing answered, is
    // closed but not counted: a paper opened by mistake and shut again must
    // not spend an attempt or put a zero into everyone's cohort.
    record = closed.questionsOpened || given.size > 0;

    // With the pause button off, the clock is the server's: a paper that
    // arrives long after its time ran out is a paper whose clock was held.
    // The sitting still ends and the attempt still counts — with the sheet
    // the server held at the bell, which the exam page keeps sending up
    // while the clock runs. With pause on, the browser keeps the time, and
    // the server cannot know how long the candidate stopped the clock for.
    if (closed.late && !pauseAllowed) {
      answers = toAnswers(closed.snapshot ?? {});
    }
  } else {
    // A sitting whose clock has run out with no submit — the browser was
    // closed mid-paper — is ended here on whatever sheet the server last
    // saw, so the candidate is not left with a paper that can neither be
    // submitted nor seen. A sitting with time still on it is not touched.
    const expired = await closeExpiredSitting(paper.id, profile.id, instructionSec, limitSec);

    if (expired) {
      answers = toAnswers(expired.snapshot ?? {});
      record = expired.questionsOpened || answers.size > 0;
      durationSec = expired.durationSec;
    } else {
      const last = await lastSubmission(paper.id, profile.id, limitSec);
      if (last) {
        durationSec = last.durationSec;
        // The server's copy, always — never the browser's. A sitting closed
        // before answers were kept with it falls back to the attempt's own
        // copy inside lastSubmission; one with neither is marked as blank.
        // Marking the browser's answers here, even for those old rows, would
        // reopen the key-by-guessing oracle for every candidate who has one.
        answers = toAnswers(last.responses);
      } else if (!admin) {
        return NextResponse.json({ error: "Submit the paper first" }, { status: 403 });
      }
      // An admin with no sitting is previewing: marked, never recorded.
    }
  }

  const marked = mark(rows, answers);
  const attempted = marked.filter((q) => q.given !== null).length;
  const correct = marked.filter((q) => q.isCorrect).length;

  const stats = await statsFor({
    marks: correct,
    attempted,
    total: marked.length,
    record,
    // The sheet as marked: known questions, offered numbers, nothing else.
    responses: Object.fromEntries(
      marked.filter((q) => q.given !== null).map((q) => [q.id, q.given as number]),
    ),
    paper,
    userId: profile.id,
    durationSec,
  });

  return NextResponse.json(respond(marked, stats, durationSec));
}

/** No paper has this many questions; anything past it is not an answer sheet. */
const MAX_ANSWERS = 500;
/** A question id is a 36-character uuid; a longer key is not one. */
const MAX_KEY_LENGTH = 64;

/**
 * questionId -> chosen number. Anything else in the object is ignored, and the
 * sheet is cut off at a size no real paper reaches, so a post cannot park a
 * multi-megabyte object in the sitting for every admin page to load later.
 */
function toAnswers(raw: unknown): Map<string, number> {
  const given = new Map<string, number>();
  if (raw && typeof raw === "object") {
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      if (given.size >= MAX_ANSWERS) break;
      if (key.length > MAX_KEY_LENGTH) continue;
      if (typeof value === "number" && Number.isInteger(value) && Math.abs(value) < MAX_OPTION) {
        given.set(key, value);
      }
    }
  }
  return given;
}

/**
 * The response as published. Hidden panels are dropped HERE rather than in
 * the page, so a figure the institute chose not to publish never reaches the
 * browser at all — hiding it in the markup would leave it in the response for
 * anyone who opened the network tab.
 */
function respond(marked: MarkedQuestion[], stats: Stats | null, durationSec: number | null) {
  const attempted = marked.filter((q) => q.given !== null).length;
  const correct = marked.filter((q) => q.isCorrect).length;
  const tRaw = tScore(correct, stats?.cohort ?? null);
  const view = resolveResultView(stats?.resultView);

  // The T-score as published. The cohort figures behind it travel only when a
  // panel that shows them is on; otherwise a hidden mean and sd sat inside the
  // response for anyone reading the network tab.
  const t =
    view.tScore && tRaw
      ? view.tScoreStats || view.tScoreFormula
        ? tRaw
        : { value: tRaw.value, note: tRaw.note }
      : null;

  // The questions as published. The review off means none at all — every
  // question, key included, used to ship regardless. The key off strips the
  // answer AND the worked solution, which spells the answer out; the verdict
  // on each question stays, since Correct / Incorrect is the review's point.
  const questions = !view.review
    ? []
    : view.correctAnswers
      ? marked
      : marked.map(({ correct: _c, workingEn: _e, workingHi: _h, ...rest }) => rest);

  return {
    questions,
    score: {
      total: marked.length,
      attempted,
      correct,
      wrong: attempted - correct,
      accuracy: attempted ? (correct / attempted) * 100 : 0,
    },
    tScore: t,
    topics: view.topicBreakdown ? topicBreakdown(marked) : [],
    standing: pickStanding(stats?.standing ?? null, view),
    // Decided on the REAL T-score whether or not it is shown; only the wording
    // withholds the figure. A verdict must never depend on a display switch.
    cutOff:
      view.cutOff && stats
        ? decideCutOff(stats.cutOff, correct, tRaw?.value ?? null, {
            useMarks: view.cutOffMarks,
            showTScore: view.tScore,
          })
        : null,
    expertComment: view.expertComment ? stats?.expertComment ?? null : null,
    durationSec: view.timeAnalysis ? durationSec : null,
    history: view.attemptHistory ? stats?.history ?? [] : [],
    view,
  };
}

/** Only the halves of the standing this paper publishes. */
function pickStanding(
  standing: Standing | null,
  view: ReturnType<typeof resolveResultView>,
): StandingWire | null {
  if (!standing) return null;
  const out: StandingWire = {};
  if (view.rank) {
    out.rank = standing.rank;
    out.outOf = standing.outOf;
  }
  if (view.percentile) out.percentile = standing.percentile;
  return view.rank || view.percentile ? out : null;
}

/** Per-topic tally, weakest topic first, so the candidate sees where to work. */
function topicBreakdown(marked: MarkedQuestion[]): TopicRow[] {
  const byTopic = new Map<string, MarkedQuestion[]>();
  for (const q of marked) {
    const rows = byTopic.get(q.topic) ?? [];
    rows.push(q);
    byTopic.set(q.topic, rows);
  }
  return [...byTopic.entries()]
    .map(([topic, rows]) => {
      const attempted = rows.filter((q) => q.given !== null).length;
      const correct = rows.filter((q) => q.isCorrect).length;
      return {
        topic,
        total: rows.length,
        attempted,
        correct,
        accuracy: attempted ? (correct / attempted) * 100 : 0,
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total);
}

interface Stats {
  cohort: Cohort | null;
  standing: Standing | null;
  cutOff: { marks: number | null; tScore: number | null };
  expertComment: string | null;
  resultView: ResultView;
  /** This candidate's attempts of the paper, oldest first, this one included. */
  history: HistoryPoint[];
}

/**
 * Records the attempt if this call closed the sitting, then returns the
 * figures the T-score is measured against.
 *
 * The live cohort is used once enough papers have been submitted; below that an
 * institute's own reference mean and standard deviation stand in, because a
 * mean taken from two attempts says nothing.
 */
async function statsFor({
  marks,
  attempted,
  total,
  record: shouldRecord,
  responses,
  paper,
  userId,
  durationSec,
}: {
  marks: number;
  attempted: number;
  total: number;
  record: boolean;
  /** What was chosen per question, kept for the per-question breakdown. */
  responses: Record<string, number>;
  paper: PaperRow;
  userId: string;
  /** Measured by the server from the sitting. */
  durationSec: number | null;
}): Promise<Stats> {
  const supabase = createAdminClient();

  const cutOff = {
    marks: paper.cut_off_marks === null ? null : Number(paper.cut_off_marks),
    tScore: paper.cut_off_tscore === null ? null : Number(paper.cut_off_tscore),
  };

  // The cohort as one sum, done by the database, and this candidate's own
  // attempts — side by side. Fetching every attempt of the paper here used
  // to stop quietly at a thousand rows, so the figures went wrong for
  // exactly the papers with the most candidates.
  const [aggregate, { data: ownRows }] = await Promise.all([
    supabase
      .rpc("watch_cohort", { p_paper: paper.id, p_total: total, p_user: userId, p_marks: marks })
      .maybeSingle(),
    supabase
      .from("watch_attempts")
      .select("marks, total, attempted, duration_sec, submitted_at")
      .eq("paper_id", paper.id)
      .eq("user_id", userId)
      .order("submitted_at", { ascending: true }),
  ]);

  const history: HistoryPoint[] = (ownRows ?? []).map((a) => ({
    at: new Date(a.submitted_at as string).getTime(),
    marks: a.marks as number,
    total: a.total as number,
    attempted: a.attempted as number,
    durationSec: (a.duration_sec as number | null) ?? null,
  }));

  // The same limit the exam page applies, applied again here. That page can
  // be skipped — this route is reachable on its own — so the count must be
  // guarded where the row is actually written, not only where the paper is
  // handed out.
  let record = shouldRecord;
  if (record && paper.max_attempts !== null && paper.max_attempts !== undefined) {
    if (history.length >= Number(paper.max_attempts)) record = false;
  }

  let recorded = false;
  if (record) {
    const { data: made } = await supabase
      .from("watch_attempts")
      .insert({
        paper_id: paper.id,
        user_id: userId,
        marks,
        total,
        attempted,
        // The server's measurement, never the browser's claim.
        duration_sec: durationSec,
        // What was chosen per question, so the batch's weak spots can be found
        // later. Unanswered questions are left out rather than stored as null.
        responses,
      })
      .select("submitted_at")
      .single();

    // Counted into the figures below only once it is actually on record.
    if (made) {
      recorded = true;
      history.push({
        at: new Date(made.submitted_at as string).getTime(),
        marks,
        total,
        attempted,
        durationSec,
      });
    }
  }

  // A database the schema file has not been re-run on has no watch_cohort()
  // yet. The rows are read instead — page by page — so no result is refused.
  let agg = (aggregate.data as CohortAggregate | null) ?? null;
  if (aggregate.error || !agg) {
    const rows = await fetchAll<AttemptMark>((from, to) =>
      supabase
        .from("watch_attempts")
        .select("user_id, marks, total, submitted_at")
        .eq("paper_id", paper.id)
        .order("submitted_at", { ascending: true })
        .order("id")
        .range(from, to),
    );
    agg = aggregateFromRows(
      // The row just written is already among these; keep it out and let it
      // come back in as the contribution below, the same as the RPC path.
      recorded ? rows.filter((r) => r.user_id !== userId) : rows,
      userId,
      total,
      marks,
    );
    if (recorded) agg.own_latest = null;
  }

  // One mark per candidate, their latest: everyone else's, plus this
  // candidate's own — the mark just recorded, or their previous latest.
  const contribution = recorded ? marks : agg.own_latest;

  return {
    cohort: cohortFromMoments(momentsFromAggregate(agg, contribution), paper),
    standing: standingFromAggregate(agg),
    cutOff,
    expertComment: paper.expert_comment ?? null,
    resultView: (paper.result_view ?? {}) as ResultView,
    history,
  };
}

interface PaperRow {
  id: string;
  is_published: boolean;
  reference_mean: number | null;
  reference_sd: number | null;
  stats_min_attempts: number | null;
  cut_off_marks: number | null;
  cut_off_tscore: number | null;
  expert_comment: string | null;
  max_attempts: number | null;
  result_view: ResultView | null;
  features: WatchFeatures | null;
  instruction_time_min: number | null;
  time_limit_min: number | null;
}

/** The paper's scoring settings, in one query. */
async function fetchPaperRow(slug: string): Promise<PaperRow | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("watch_papers")
    .select(
      "id, is_published, reference_mean, reference_sd, stats_min_attempts, cut_off_marks, cut_off_tscore, expert_comment, max_attempts, result_view, features, instruction_time_min, time_limit_min",
    )
    .eq("slug", slug)
    .maybeSingle();
  return (data as PaperRow) ?? null;
}

interface QuestionRow {
  id: string;
  position: number;
  prompt_en: string;
  prompt_hi: string;
  options: number[];
  answer: number;
  working_en: string | null;
  working_hi: string | null;
  topic: string | null;
}

/** The paper's questions with their key, in order. Service role: the key column is revoked from everyone else. */
async function fetchQuestions(paperId: string): Promise<QuestionRow[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("watch_questions")
    .select("id, position, prompt_en, prompt_hi, options, answer, working_en, working_hi, topic")
    .eq("paper_id", paperId)
    .order("position");
  return (data ?? []) as QuestionRow[];
}

function mark(rows: QuestionRow[], given: Map<string, number>): MarkedQuestion[] {
  return rows.map((q) => {
    // Only one of the numbers on offer is an answer. Anything else — a value
    // no button produces — is not "wrong", it is not an answer at all.
    const raw = given.get(q.id);
    const chosen = raw !== undefined && q.options.includes(raw) ? raw : null;
    return {
      id: q.id,
      position: q.position,
      promptEn: q.prompt_en,
      promptHi: q.prompt_hi,
      options: q.options,
      given: chosen,
      correct: q.answer,
      isCorrect: chosen === q.answer,
      workingEn: q.working_en ?? "",
      workingHi: q.working_hi ?? "",
      topic: q.topic ?? "",
    };
  });
}

/**
 * The bundled sample paper, for a portal with no database yet: a demo with no
 * accounts and nothing to record, marked so the result screen can be seen.
 */
function markFromBundle(
  paperId: string,
  given: Map<string, number>,
): MarkedQuestion[] | null {
  const paper = getBundledPaper(paperId);
  if (!paper) return null;

  return paper.questions.map((q, i) => {
    const chosen = given.get(q.id) ?? null;
    return {
      id: q.id,
      position: i,
      promptEn: q.prompt.en,
      promptHi: q.prompt.hi,
      options: q.options,
      given: chosen,
      correct: q.answer,
      isCorrect: chosen === q.answer,
      workingEn: q.working.en,
      workingHi: q.working.hi,
      topic: q.topic ?? "",
    };
  });
}
