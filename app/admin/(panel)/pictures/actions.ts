"use server";

import { requireAdmin } from "@/lib/auth";
import { checkCopies, forgetFailures, mirrorBatch, type BatchOutcome, type Checked } from "@/lib/images/mirror";

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

/** Copies the next batch of pictures not yet copied. */
export async function copyNextBatch(): Promise<Reply<BatchOutcome>> {
  return reply(mirrorBatch);
}

/** Forgets the failures so Copy tries them again. */
export async function retryFailures(): Promise<Reply<number>> {
  return reply(forgetFailures);
}

/** Looks at the newest copies through the given picture domain (or R2's API without one). */
export async function checkPictures(domain: string): Promise<Reply<Checked[]>> {
  return reply(() => checkCopies(String(domain ?? "")));
}
