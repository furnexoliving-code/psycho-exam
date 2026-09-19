import { createAdminClient } from "@/lib/supabase/admin";

export interface Sitting {
  id: string;
  /** Seconds since the server started this sitting. */
  elapsedSec: number;
  /** True when this tab joined a sitting that was already running. */
  resumed: boolean;
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
  paperSlug: string,
  userId: string,
): Promise<Sitting | null> {
  const supabase = createAdminClient();

  const { data: paper } = await supabase
    .from("watch_papers")
    .select("id")
    .eq("slug", paperSlug)
    .maybeSingle();
  if (!paper) return null;

  const { data: open } = await supabase
    .from("watch_sessions")
    .select("id, started_at")
    .eq("paper_id", paper.id)
    .eq("user_id", userId)
    .is("submitted_at", null)
    .maybeSingle();

  if (open) {
    return { id: open.id, elapsedSec: secondsSince(open.started_at), resumed: true };
  }

  const { data: made, error } = await supabase
    .from("watch_sessions")
    .insert({ paper_id: paper.id, user_id: userId })
    .select("id, started_at")
    .single();

  // Two tabs opened at once race here, and the index refuses the loser. That
  // is the index doing its job: read back the one that won rather than
  // reporting a failure the candidate can do nothing about.
  if (error) {
    const { data: winner } = await supabase
      .from("watch_sessions")
      .select("id, started_at")
      .eq("paper_id", paper.id)
      .eq("user_id", userId)
      .is("submitted_at", null)
      .maybeSingle();

    return winner
      ? { id: winner.id, elapsedSec: secondsSince(winner.started_at), resumed: true }
      : null;
  }

  return { id: made.id, elapsedSec: 0, resumed: false };
}

/**
 * Ends the sitting and returns how long it actually took.
 *
 * Returns null when there was no open sitting — the paper has already been
 * submitted, so this is a replay or a second tab arriving late, and its
 * attempt must not be recorded a second time.
 */
export async function closeSitting(
  paperId: string,
  userId: string,
  limitSec: number,
): Promise<number | null> {
  const supabase = createAdminClient();

  const { data: open } = await supabase
    .from("watch_sessions")
    .select("id, started_at")
    .eq("paper_id", paperId)
    .eq("user_id", userId)
    .is("submitted_at", null)
    .maybeSingle();

  if (!open) return null;

  const { data: closed } = await supabase
    .from("watch_sessions")
    .update({ submitted_at: new Date().toISOString() })
    .eq("id", open.id)
    // Only close a sitting that is still open. Two submits arriving together
    // means the second one changes nothing and gets no attempt.
    .is("submitted_at", null)
    .select("id");

  if (!closed?.length) return null;

  // A candidate who walks away and returns hours later must not record a
  // six-hour attempt: the paper could not have run longer than its own limit.
  return Math.min(limitSec, secondsSince(open.started_at));
}

function secondsSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
}
