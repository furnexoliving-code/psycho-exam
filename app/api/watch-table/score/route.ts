import { NextResponse } from "next/server";
import { getProfile, isConfigured } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBundledPaper } from "@/lib/wt/paper";
import { meanAndSd, tScore, type Cohort } from "@/lib/wt/tscore";

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

  const marked = isConfigured()
    ? await markFromDatabase(paperId, given)
    : markFromBundle(paperId, given);

  if (!marked) return NextResponse.json({ error: "Paper not found" }, { status: 404 });

  const attempted = marked.filter((q) => q.given !== null).length;
  const correct = marked.filter((q) => q.isCorrect).length;

  const stats = isConfigured()
    ? await statsFor({
        slug: paperId,
        marks: correct,
        attempted,
        total: marked.length,
        durationSec,
        record: body.record === true,
      })
    : null;

  const t = tScore(correct, stats?.cohort ?? null);

  return NextResponse.json({
    questions: marked,
    score: {
      total: marked.length,
      attempted,
      correct,
      wrong: attempted - correct,
      accuracy: attempted ? (correct / attempted) * 100 : 0,
    },
    tScore: t,
    topics: topicBreakdown(marked),
    standing: stats?.standing ?? null,
    cutOff: stats ? decideCutOff(stats.cutOff, correct, t?.value ?? null) : null,
    expertComment: stats?.expertComment ?? null,
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
  if (byMarks !== null) parts.push(`${marks} of ${cutOff.marks} marks needed`);
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
  slug,
  marks,
  attempted,
  total,
  durationSec,
  record,
}: {
  slug: string;
  marks: number;
  attempted: number;
  total: number;
  durationSec: number | null;
  record: boolean;
}): Promise<{
  cohort: Cohort | null;
  standing: Standing | null;
  cutOff: { marks: number | null; tScore: number | null };
  expertComment: string | null;
} | null> {
  const supabase = createAdminClient();

  const { data: paper } = await supabase
    .from("watch_papers")
    .select(
      "id, reference_mean, reference_sd, stats_min_attempts, cut_off_marks, cut_off_tscore, expert_comment",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (!paper) return null;

  const cutOff = {
    marks: paper.cut_off_marks === null ? null : Number(paper.cut_off_marks),
    tScore: paper.cut_off_tscore === null ? null : Number(paper.cut_off_tscore),
  };

  if (record) {
    const profile = await getProfile();
    await supabase.from("watch_attempts").insert({
      paper_id: paper.id,
      user_id: profile?.id ?? null,
      marks,
      total,
      attempted,
      duration_sec: durationSec,
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
