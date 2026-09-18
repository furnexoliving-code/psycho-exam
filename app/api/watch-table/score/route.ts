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

  const cohort = isConfigured()
    ? await cohortFor(paperId, correct, attempted, marked.length, body.record === true)
    : null;

  return NextResponse.json({
    questions: marked,
    score: {
      total: marked.length,
      attempted,
      correct,
      wrong: attempted - correct,
      accuracy: attempted ? (correct / attempted) * 100 : 0,
    },
    tScore: tScore(correct, cohort),
  });
}

/**
 * Records the attempt if this is the submitting call, then returns the figures
 * the T-score is measured against.
 *
 * The live cohort is used once enough papers have been submitted; below that an
 * institute's own reference mean and standard deviation stand in, because a
 * mean taken from two attempts says nothing.
 */
async function cohortFor(
  slug: string,
  marks: number,
  attempted: number,
  total: number,
  record: boolean,
): Promise<Cohort | null> {
  const supabase = createAdminClient();

  const { data: paper } = await supabase
    .from("watch_papers")
    .select("id, reference_mean, reference_sd, stats_min_attempts")
    .eq("slug", slug)
    .maybeSingle();
  if (!paper) return null;

  if (record) {
    const profile = await getProfile();
    await supabase.from("watch_attempts").insert({
      paper_id: paper.id,
      user_id: profile?.id ?? null,
      marks,
      total,
      attempted,
    });
  }

  const { data: rows } = await supabase
    .from("watch_attempts")
    .select("marks")
    .eq("paper_id", paper.id);

  const all = (rows ?? []).map((r) => r.marks as number);
  const minimum = paper.stats_min_attempts ?? 5;

  if (all.length >= minimum) {
    const { mean, sd } = meanAndSd(all);
    return { count: all.length, mean, sd, source: "cohort" };
  }

  if (paper.reference_mean !== null && paper.reference_sd !== null) {
    return {
      count: all.length,
      mean: Number(paper.reference_mean),
      sd: Number(paper.reference_sd),
      source: "reference",
    };
  }

  return null;
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
    .select("id, position, prompt_en, prompt_hi, options, answer, working_en, working_hi")
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
    };
  });
}
