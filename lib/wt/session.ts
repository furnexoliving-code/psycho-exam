import { createAdminClient } from "@/lib/supabase/admin";
import type { OptionValue } from "./types";

export interface Sitting {
  id: string;
  /** Seconds since the server started this sitting. */
  elapsedSec: number;
  /**
   * Seconds since the questions opened, or null while the candidate is still
   * on the instruction screen. This is the clock the test's own countdown is
   * held to.
   */
  questionElapsedSec: number | null;
  /** True when this tab joined a sitting that was already running. */
  resumed: boolean;
}

/** What ending a sitting establishes about it. */
export interface Closed {
  /** How long the questions took, by the server's clock. */
  durationSec: number;
  /** False when the candidate never left the instruction screen. */
  questionsOpened: boolean;
  /** True when the submit arrived well after the paper's time was up. */
  late: boolean;
  /**
   * The sheet as the server last saw it while the clock was still running —
   * what the hall would have collected at the bell. Null when nothing was
   * ever saved.
   */
  snapshot: Record<string, OptionValue> | null;
}

/** How long past the limit a submit may still arrive and count. Covers a slow
 *  network or a laptop that slept for a moment; not a clock held for an hour. */
const LATE_GRACE_SEC = 180;

/** What a closed sitting holds, for marking it again on a later visit. */
export interface Submission {
  /** questionId -> chosen number. Null on rows written before it was kept. */
  responses: Record<string, OptionValue> | null;
  /** How long the questions took, by the server's clock. */
  durationSec: number | null;
}

interface SittingRow {
  id: string;
  started_at: string;
  questions_started_at: string | null;
}

function toSitting(row: SittingRow, resumed: boolean): Sitting {
  return {
    id: row.id,
    elapsedSec: secondsSince(row.started_at),
    questionElapsedSec: row.questions_started_at
      ? secondsSince(row.questions_started_at)
      : null,
    resumed,
  };
}

/**
 * Starts the candidate's sitting of a paper, or joins the one already running.
 *
 * The clock belongs to the server. A browser that reports how long it took can
 * report anything, and a second tab used to start a second attempt with a
 * fresh countdown. One unsubmitted row per candidate per paper — enforced by a
 * partial unique index, not by this code winning a race — means the second tab
 * joins the first sitting and inherits the time already spent.
 */
export async function openSitting(
  paperDbId: string,
  userId: string,
): Promise<Sitting | null> {
  const supabase = createAdminClient();
  const paper = { id: paperDbId };

  const { data: open } = await supabase
    .from("watch_sessions")
    .select("id, started_at, questions_started_at")
    .eq("paper_id", paper.id)
    .eq("user_id", userId)
    .is("submitted_at", null)
    .maybeSingle();

  if (open) return toSitting(open as SittingRow, true);

  const { data: made, error } = await supabase
    .from("watch_sessions")
    .insert({ paper_id: paper.id, user_id: userId })
    .select("id, started_at, questions_started_at")
    .single();

  // Two tabs opened at once race here, and the index refuses the loser. That
  // is the index doing its job: read back the one that won rather than
  // reporting a failure the candidate can do nothing about.
  if (error) {
    const { data: winner } = await supabase
      .from("watch_sessions")
      .select("id, started_at, questions_started_at")
      .eq("paper_id", paper.id)
      .eq("user_id", userId)
      .is("submitted_at", null)
      .maybeSingle();

    return winner ? toSitting(winner as SittingRow, true) : null;
  }

  return toSitting(made as SittingRow, false);
}

/**
 * Notes the moment the questions opened, once. The time a candidate spends
 * reading the instructions is not time spent on the paper, so the duration
 * reported back to them is measured from here, not from when the page loaded.
 */
export async function markQuestionsStarted(
  paperSlug: string,
  userId: string,
): Promise<void> {
  const supabase = createAdminClient();

  const { data: paper } = await supabase
    .from("watch_papers")
    .select("id")
    .eq("slug", paperSlug)
    .maybeSingle();
  if (!paper) return;

  await supabase
    .from("watch_sessions")
    .update({ questions_started_at: new Date().toISOString() })
    .eq("paper_id", paper.id)
    .eq("user_id", userId)
    .is("submitted_at", null)
    // First call wins; a reload must not restart the clock.
    .is("questions_started_at", null);
}

/**
 * Ends the sitting, keeps what was answered, and returns how long it took.
 *
 * Returns null when there was no open sitting — the paper has already been
 * submitted, so this is a replay or a second tab arriving late, and its
 * attempt must not be recorded a second time.
 */
export async function closeSitting(
  paperId: string,
  userId: string,
  instructionSec: number,
  limitSec: number,
  responses: Record<string, OptionValue>,
  /** Whether a late submit is held to the bell (pause off) or taken as sent (pause on). */
  honourLate: boolean,
): Promise<Closed | null> {
  const supabase = createAdminClient();

  const { data: open } = await supabase
    .from("watch_sessions")
    .select("id, started_at, questions_started_at, responses")
    .eq("paper_id", paperId)
    .eq("user_id", userId)
    .is("submitted_at", null)
    .maybeSingle();

  if (!open) return null;
  const row = open as SittingRow & { responses: Record<string, OptionValue> | null };
  const now = new Date().toISOString();
  const late = overrun(row, instructionSec, limitSec) > LATE_GRACE_SEC;

  // A late submit keeps the sheet the server held at the bell, not the one
  // sent up now; an on-time submit is the sheet itself.
  const kept = honourLate && late && row.responses ? row.responses : responses;

  const { data: closed } = await supabase
    .from("watch_sessions")
    .update({ submitted_at: now, responses: kept })
    .eq("id", row.id)
    // Only close a sitting that is still open. Two submits arriving together
    // means the second one changes nothing and gets no attempt.
    .is("submitted_at", null)
    .select("id");

  if (!closed?.length) return null;

  return {
    durationSec: duration(row, now, limitSec),
    questionsOpened: row.questions_started_at !== null,
    late,
    snapshot: row.responses ?? null,
  };
}

/**
 * Keeps the sheet as it stands while the clock runs, so a browser that dies
 * mid-paper — power cut, closed lid, crash — has not lost what was answered:
 * a late submit is marked from this copy. Refused once the paper's time is
 * up, so a clock held open in the browser cannot keep adding answers after
 * the bell.
 */
export async function saveSnapshot(
  paperSlug: string,
  userId: string,
  responses: Record<string, OptionValue>,
): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: paper } = await supabase
    .from("watch_papers")
    .select("id, instruction_time_min, time_limit_min")
    .eq("slug", paperSlug)
    .maybeSingle();
  if (!paper) return false;

  const { data: open } = await supabase
    .from("watch_sessions")
    .select("id, started_at, questions_started_at")
    .eq("paper_id", paper.id)
    .eq("user_id", userId)
    .is("submitted_at", null)
    .maybeSingle();
  if (!open) return false;

  const row = open as SittingRow;
  const instructionSec = (paper.instruction_time_min ?? 0) * 60;
  const limitSec = (paper.time_limit_min ?? 0) * 60;
  if (overrun(row, instructionSec, limitSec) > LATE_GRACE_SEC) return false;

  const { data: saved } = await supabase
    .from("watch_sessions")
    .update({ responses })
    .eq("id", row.id)
    .is("submitted_at", null)
    .select("id");
  return (saved?.length ?? 0) > 0;
}

/**
 * Closes a sitting whose time has run out, with nothing answered, and returns
 * how long it took — or null when there is no open sitting, or the open one
 * still has time on the clock.
 *
 * A candidate who closed the browser mid-paper and comes back on another
 * device has an open sitting, no local copy of their answers, and a clock
 * that has long since run out. Without this they could neither submit (no
 * answers to send) nor see a result (nothing submitted), and the sitting
 * would sit open for good. A sitting that is still live is left alone: only
 * the candidate's own submit may end that one.
 */
export async function closeExpiredSitting(
  paperId: string,
  userId: string,
  instructionSec: number,
  limitSec: number,
): Promise<Closed | null> {
  const supabase = createAdminClient();

  const { data: open } = await supabase
    .from("watch_sessions")
    .select("id, started_at, questions_started_at")
    .eq("paper_id", paperId)
    .eq("user_id", userId)
    .is("submitted_at", null)
    .maybeSingle();
  if (!open) return null;

  const row = open as SittingRow;
  if (overrun(row, instructionSec, limitSec) < 0) return null;
  const now = new Date().toISOString();

  // The sheet the server last saw stays: an abandoned paper is marked on
  // what was answered before the browser went, not on nothing.
  const { data: closed } = await supabase
    .from("watch_sessions")
    .update({ submitted_at: now })
    .eq("id", row.id)
    .is("submitted_at", null)
    .select("id, responses");
  if (!closed?.length) return null;

  return {
    durationSec: duration(row, now, limitSec),
    questionsOpened: row.questions_started_at !== null,
    late: false,
    snapshot: (closed[0].responses as Record<string, OptionValue> | null) ?? null,
  };
}

/**
 * Seconds past the point the paper's own clock ran out — negative while there
 * is still time. From when the questions opened when that is known; otherwise
 * the instruction time and the test time together, from when the page loaded.
 */
function overrun(row: SittingRow, instructionSec: number, limitSec: number): number {
  return row.questions_started_at
    ? secondsSince(row.questions_started_at) - limitSec
    : secondsSince(row.started_at) - (instructionSec + limitSec);
}

/**
 * The candidate's most recent submission of this paper, for showing its
 * result again — on a reload, on another device, or after the browser's own
 * copy is gone. The answers marked are the ones the server kept at submit
 * time, never a fresh set sent up afterwards: marking arbitrary answers on
 * demand would hand out the key one guess at a time.
 */
export async function lastSubmission(
  paperId: string,
  userId: string,
  limitSec: number,
): Promise<Submission | null> {
  const supabase = createAdminClient();

  const { data: sitting } = await supabase
    .from("watch_sessions")
    .select("id, started_at, questions_started_at, submitted_at, responses")
    .eq("paper_id", paperId)
    .eq("user_id", userId)
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sittingResponses = sitting
    ? ((sitting.responses as Record<string, OptionValue> | null) ?? null)
    : null;
  const sittingDuration = sitting
    ? duration(sitting as SittingRow, sitting.submitted_at as string, limitSec)
    : null;

  if (sitting && sittingResponses) {
    return { responses: sittingResponses, durationSec: sittingDuration };
  }

  // No sitting, or one closed before answers were kept with it: the attempt
  // recorded at the time holds its own copy of what was answered.
  const { data: attempt } = await supabase
    .from("watch_attempts")
    .select("responses, duration_sec")
    .eq("paper_id", paperId)
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!attempt) {
    // A closed sitting with nothing recorded — over the limit, or nothing
    // answered on a paper never opened. It is a submission, of a blank sheet.
    return sitting ? { responses: {}, durationSec: sittingDuration } : null;
  }
  return {
    responses: (attempt.responses as Record<string, OptionValue> | null) ?? {},
    durationSec: sittingDuration ?? attempt.duration_sec ?? null,
  };
}

/**
 * How long the questions took: from when they opened (or, on a sitting that
 * never noted it, from when the page loaded) to the submit. A candidate who
 * walks away and returns hours later must not record a six-hour attempt: the
 * paper could not have run longer than its own limit.
 */
function duration(row: SittingRow, endIso: string, limitSec: number): number {
  const from = new Date(row.questions_started_at ?? row.started_at).getTime();
  const to = new Date(endIso).getTime();
  return Math.min(limitSec, Math.max(0, Math.floor((to - from) / 1000)));
}

function secondsSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
}
