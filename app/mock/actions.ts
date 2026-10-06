"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { abandonMock, advanceMock, openMockSitting } from "@/lib/wt/mock";

/** Starts the mock, or rejoins it, and opens the test it is on. */
export async function startMock(formData: FormData): Promise<void> {
  const slug = String(formData.get("slug") ?? "");
  const who = await requireUser(`/mock/${slug}`);
  const opened = await openMockSitting(slug, who.id);
  if (!opened.ok) redirect(`/mock/${slug}?error=${encodeURIComponent(opened.reason)}`);
  redirect(`/watch-table/${opened.step.paper.slug}`);
}

/** Gives the sitting up. Nothing is scored and no attempt is spent. */
export async function leaveMock(formData: FormData): Promise<void> {
  const slug = String(formData.get("slug") ?? "");
  const who = await requireUser(`/mock/${slug}`);
  await abandonMock(who.id);
  redirect(`/mock/${slug}?left=1`);
}

export type MockNext =
  | { next: "paper"; url: string; gapSec: number; step: number; total: number }
  | { next: "done"; url: string }
  | { next: "none" };

/**
 * Called by the result page of a test sat inside a mock, once the attempt
 * is on record: moves the mock on and says where to go. "none" means this
 * paper was not the mock's current test, so there is nothing to do.
 */
export async function continueMock(paperSlug: string): Promise<MockNext> {
  const who = await requireUser(`/watch-table/${paperSlug}/result`);
  const { data: paper } = await createAdminClient().from("watch_papers").select("id").eq("slug", paperSlug).maybeSingle();
  if (!paper) return { next: "none" };
  const moved = await advanceMock(who.id, paper.id as string);
  if (!moved) return { next: "none" };
  if (moved.next === "done") return { next: "done", url: `/mock/${moved.slug}/result` };
  return { next: "paper", url: `/watch-table/${moved.slug}`, gapSec: moved.gapSec, step: moved.step, total: moved.total };
}
