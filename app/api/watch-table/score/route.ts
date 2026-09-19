import { NextResponse } from "next/server";
import { getProfile, isConfigured } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBundledPaper } from "@/lib/wt/paper";
import { meanAndSd, tScore, type Cohort } from "@/lib/wt/tscore";
import { resolveResultView, type ResultView } from "@/lib/wt/types";

/**
 * Scores an attempt on the server.
 *
 * The answer key must never reach a candidate's browser: otherwise anyone can
 * open the result page in a second tab, read the page source and copy every
 * answer back into the running test. So the browser posts what it chose, this
 * route looks the key up with the service-role client, and only the marked-up
 * result goes back.
 */

interface Body {
  paperId?: unknown;
  answers?: unknown;
  /** True on the submit that ends the attempt; false when merely reviewing. */
  record?: unknown;
  /** Seconds the candidate spent on the questions. */
  durationSec?: unknown;
}

export interface MarkedQuestion {
  id: string;
  position: number;
  promptEn: string;
  promptHi: string;
  options: number[];
  given: number | null;
  correct: number;
  isCorrect: boolean;
  workingEn: string;
  workingHi: string;
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

export interface CutOff {
  marks: number | null;
  tScore: number | null;
  qualified: boolean;
  /** Which bar decided it, when both are set. */
  reason: string;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }

  const durationSec =
    typeof body.durationSec === "number" && Number.isFinite(body.durationSec)
      ? Math.max(0, Math.round(body.durationSec))
      : null;

  const paperId = typeof body.paperId === "string" ? body.paperId : "";
  if (!paperId) {
    return NextResponse.json({ error: "paperId is required" }, { status: 400 });
  }

  // questionId -> chosen number. Anything else in the object is ignored.
  const given = new Map<string, number>();
  if (body.answers && typeof body.answers === "object") {
    for (const [key, value] of Object.entries(body.answers as Record<string, unknown>)) {
      if (typeof value === "number" && Number.isInteger(value)) given.set(key, value);
    }
  }

  const [marked, paperRow] = isConfigured()
    ? await Promise.all([markFromDatabase(paperId, given), fetchPaperRow(paperId)])
    : [markFromBundle(paperId, given), null];

  if (!marked) return NextResponse.json({ error: "Paper not found" }, { status: 404 });

  const attempted = marked.filter((q) => q.given !== null).length;
  const correct = marked.filter((q) => q.isCorrect).length;

  const stats = isConfigured()
    ? await statsFor({
        marks: correct,
        attempted,
        total: marked.length,
        durationSec,
        record: body.record === true,
        // `given` is a Map — Object.entries on one returns nothing, which
        // would have stored an empty breakdown without any error.
        responses: Object.fromEntries(given),
        paper: paperRow,
      })
    : null;

  const tRaw = tScore(correct, stats?.cohort ?? null);

  // Which panels this paper shows. Hidden ones are dropped HERE rather than in
  // the page, so a figure the institute chose not to publish never reaches the
  // browser at all — hiding it in the markup would leave it in the response
  // for anyone who opened the network tab.
  const view = resolveResultView(stats?.resultView);
  const t = view.tScore ? tRaw : null;

  return NextResponse.json({
    questions: view.correctAnswers
      ? marked
      : marked.map(({ correct: _c, isCorrect: _i, ...rest }) => rest),
    score: {
      total: marked.length,
      attempted,
      correct,
      wrong: attempted - correct,
      accuracy: attempted ? (correct / attempted) * 100 : 0,
    },
    tScore: t,
    topics: view.topicBreakdown ? topicBreakdown(marked) : [],
    standing: view.rank || view.percentile ? stats?.standing ?? null : null,
    cutOff:
      view.cutOff && stats
        ? decideCutOff(stats.cutOff, correct, tRaw?.value ?? null, view.cutOffMarks)
        : null,
    expertComment: view.expertComment ? stats?.expertComment ?? null : null,
    view,
  });
}

/** Per-topic tally, for the "what should I revise" panel. */
function topicBreakdown(marked: MarkedQuestion[]): TopicRow[] {
  const byTopic = new Map<string, MarkedQuestion[]>();

  for (const q of marked) {
    const topic = q.topic?.trim() || "Untagged";
    byTopic.set(topic, [...(byTopic.get(topic) ?? []), q]);
  }

  // A paper with no topics at all has nothing to break down.
  if (byTopic.size === 1 && byTopic.has("Untagged")) return [];

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
    // Weakest first: that is the one worth reading.
    .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total);
}

function decideCutOff(
  cutOff: { marks: number | null; tScore: number | null },
  marks: number,
  t: number | null,
  showMarks: boolean,
): CutOff | null {
  if (cutOff.marks === null && cutOff.tScore === null) return null;

  const byMarks = cutOff.marks === null ? null : marks >= cutOff.marks;
  // A T-score bar cannot be judged before there is a T-score to judge it by.
  const byT = cutOff.tScore === null || t === null ? null : t >= cutOff.tScore;

  const checks = [byMarks, byT].filter((v): v is boolean => v !== null);
  if (checks.length === 0) {
    return {
      marks: cutOff.marks,
      tScore: cutOff.tScore,
      qualified: false,
      reason: "The T-score cut off cannot be applied until there is a T-score.",
    };
  }

  // Both bars must be cleared when both are set.
  const qualified = checks.every(Boolean);
  const parts: string[] = [];
  // The marks half is off by default: most institutes want the verdict judged
  // and explained by the T-score alone.
  if (byMarks !== null && showMarks) {
    parts.push(`${marks} of ${cutOff.marks} marks needed`);
  }
  if (byT !== null) parts.push(`T-score ${t!.toFixed(1)} against ${cutOff.tScore} needed`);

  return { marks: cutOff.marks, tScore: cutOff.tScore, qualified, reason: parts.join(" · ") };
}

/**
 * Records the attempt if this is the submitting call, then returns the figures
 * the T-score is measured against.
 *
 * The live cohort is used once enough papers have been submitted; below that an
 * institute's own reference mean and standard deviation stand in, because a
 * mean taken from two attempts says nothing.
 */
async function statsFor({
  marks,
  attempted,
  total,
  durationSec,
  record: recordRequested,
  responses,
  paper,
}: {
  marks: number;
  attempted: number;
  total: number;
  durationSec: number | null;
  record: boolean;
  /** What was chosen per question, kept for the per-question breakdown. */
  responses: Record<string, number>;
  /** Fetched alongside the marking, so it is not looked up a second time. */
  paper: PaperRow | null;
}): Promise<{
  cohort: Cohort | null;
  standing: Standing | null;
  cutOff: { marks: number | null; tScore: number | null };
  expertComment: string | null;
  resultView: ResultView;
} | null> {
  const supabase = createAdminClient();
  if (!paper) return null;

  const cutOff = {
    marks: paper.cut_off_marks === null ? null : Number(paper.cut_off_marks),
    tScore: paper.cut_off_tscore === null ? null : Number(paper.cut_off_tscore),
  };

  // Resolved once. Asking twice meant two round trips to the auth service on
  // every submit, which the candidate waits through.
  const profile = recordRequested ? await getProfile() : null;
  let record = recordRequested;

  if (record && paper.max_attempts !== null && paper.max_attempts !== undefined) {
    // The same limit the exam page applies, applied again here. That page can
    // be skipped — this route is reachable on its own — so the count must be
    // guarded where the row is actually written, not only where the paper is
    // handed out.
    const { count } = await supabase
      .from("watch_attempts")
      .select("id", { count: "exact", head: true })
      .eq("paper_id", paper.id)
      .eq("user_id", profile?.id ?? "");

    // A paper with a limit is not open to someone signed out: there is no
    // account to count against.
    if (!profile || (count ?? 0) >= Number(paper.max_attempts)) record = false;
  }

  if (record) {
    await supabase.from("watch_attempts").insert({
      paper_id: paper.id,
      user_id: profile?.id ?? null,
      marks,
      total,
      attempted,
      duration_sec: durationSec,
      // What was chosen per question, so the batch's weak spots can be found
      // later. Unanswered questions are left out rather than stored as null.
      responses,
    });
  }

  const { data: rows } = await supabase
    .from("watch_attempts")
    .select("marks")
    .eq("paper_id", paper.id);

  const all = (rows ?? []).map((r) => r.marks as number);
  const minimum = paper.stats_min_attempts ?? 5;

  let cohort: Cohort | null = null;
  if (all.length >= minimum) {
    const { mean, sd } = meanAndSd(all);
    cohort = { count: all.length, mean, sd, source: "cohort" };
  } else if (paper.reference_mean !== null && paper.reference_sd !== null) {
    cohort = {
      count: all.length,
      mean: Number(paper.reference_mean),
      sd: Number(paper.reference_sd),
      source: "reference",
    };
  }

  return {
    cohort,
    standing: standingIn(all, marks),
    cutOff,
    expertComment: paper.expert_comment ?? null,
    resultView: (paper.result_view ?? {}) as ResultView,
  };
}

/**
 * Rank and percentile within the cohort.
 *
 * Equal marks share a rank — "competition ranking", so two candidates tied at
 * the top are both 1st and the next is 3rd. The percentile is the share of the
 * cohort scoring STRICTLY less, so the bottom scorer is not told they beat
 * themselves.
 */
function standingIn(all: number[], marks: number): Standing | null {
  if (all.length === 0) return null;

  const better = all.filter((m) => m > marks).length;
  const worse = all.filter((m) => m < marks).length;

  return {
    rank: better + 1,
    outOf: all.length,
    percentile: (worse / all.length) * 100,
  };
}

interface PaperRow {
  id: string;
  reference_mean: number | null;
  reference_sd: number | null;
  stats_min_attempts: number | null;
  cut_off_marks: number | null;
  cut_off_tscore: number | null;
  expert_comment: string | null;
  max_attempts: number | null;
  result_view: ResultView | null;
}

/** The paper's scoring settings, in one query. */
async function fetchPaperRow(slug: string): Promise<PaperRow | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("watch_papers")
    .select(
      "id, reference_mean, reference_sd, stats_min_attempts, cut_off_marks, cut_off_tscore, expert_comment, max_attempts, result_view",
    )
    .eq("slug", slug)
    .maybeSingle();
  return (data as PaperRow) ?? null;
}

async function markFromDatabase(
  slug: string,
  given: Map<string, number>,
): Promise<MarkedQuestion[] | null> {
  const supabase = createAdminClient();

  const { data: paper } = await supabase
    .from("watch_papers")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!paper) return markFromBundle(slug, given);

  const { data: rows } = await supabase
    .from("watch_questions")
    .select("id, position, prompt_en, prompt_hi, options, answer, working_en, working_hi, topic")
    .eq("paper_id", paper.id)
    .order("position");

  return (rows ?? []).map((q) => {
    const chosen = given.get(q.id) ?? null;
    return {
      id: q.id,
      position: q.position,
      promptEn: q.prompt_en,
      promptHi: q.prompt_hi,
      options: q.options as number[],
      given: chosen,
      correct: q.answer,
      isCorrect: chosen === q.answer,
      workingEn: q.working_en ?? "",
      workingHi: q.working_hi ?? "",
      topic: (q.topic as string) ?? "",
    };
  });
}

/**
 * The bundled sample paper ships its key in the client bundle already — it is
 * a public demo with no database behind it — so marking it here changes
 * nothing about its secrecy. It keeps the result screen working either way.
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
