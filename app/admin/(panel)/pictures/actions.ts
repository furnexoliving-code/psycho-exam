"use server";

import { requireAdmin } from "@/lib/auth";
import { checkCopies, forgetFailures, mirrorBatch, mirrorProgress, probeConnection, type BatchOutcome, type Checked, type MirrorProgress, type Probe } from "@/lib/images/mirror";

/** What a button gets back: the value, or why not — never a thrown error the browser would swallow. */
export type Reply<T> = { ok: true; value: T } | { ok: false; error: string };

async function reply<T>(body: () => Promise<T>): Promise<Reply<T>> {
  await requireAdmin("/admin/pictures");
  try {
    return { ok: true, value: await body() };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** Copies the next batch of pictures not yet tried, from after the name given. */
export async function copyNextBatch(after: string): Promise<Reply<BatchOutcome>> {
  return reply(() => mirrorBatch(String(after ?? "")));
}

/** A true count of the copy, taken once a run ends. */
export async function countProgress(): Promise<Reply<MirrorProgress>> {
  return reply(mirrorProgress);
}

/** Forgets the failures so Copy tries them again. */
export async function retryFailures(): Promise<Reply<number>> {
  return reply(forgetFailures);
}

/** Times each leg of a copy on its own: the database, a read from Supabase, a write to R2, a read back. */
export async function testConnection(): Promise<Reply<Probe[]>> {
  return reply(probeConnection);
}

/** Looks at the newest copies through the given picture domain (or R2's API without one). */
export async function checkPictures(domain: string): Promise<Reply<Checked[]>> {
  return reply(() => checkCopies(String(domain ?? "")));
}
