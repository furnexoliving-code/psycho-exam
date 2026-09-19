import { redirect } from "next/navigation";

/**
 * Next.js implements redirect() by throwing, and that throw carries a digest
 * beginning with NEXT_REDIRECT. Catching it as a failure would turn every
 * successful redirect into an error message.
 */
function isRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

/**
 * Runs a server action so that its failures are SEEN.
 *
 * A server action that throws is reported to the browser without its message
 * in production — the form simply does nothing, which looks to an admin like a
 * dead button. Every failure is sent back to the page as ?error=… instead, and
 * every success as ?saved=…, so saving always says what happened.
 */
export async function run(
  backTo: string,
  what: string,
  /** May return a detail to show, such as how many rows were written. */
  body: () => Promise<string | void>,
): Promise<never> {
  let detail: string | void;
  try {
    detail = await body();
  } catch (error) {
    if (isRedirect(error)) throw error;

    const message = error instanceof Error ? error.message : String(error);
    redirect(`${backTo}?error=${encodeURIComponent(`${what}: ${explain(message)}`)}`);
  }

  redirect(`${backTo}?saved=${encodeURIComponent(detail ? `${what} — ${detail}` : what)}`);
}

/**
 * Turns the database's wording into something an admin can act on.
 *
 * A missing column means the latest schema file has not been run yet — by far
 * the most likely reason a save fails right after an update — and "column
 * watch_papers.font_scale does not exist" does not say that to anyone who did
 * not write the code.
 */
function explain(message: string): string {
  if (/column .* does not exist|schema cache|PGRST204/i.test(message)) {
    return `${message} — this usually means the newest SQL has not been run yet. Open Supabase → SQL Editor and run the latest watch-table-schema.sql, then reload.`;
  }
  if (/row-level security|permission denied/i.test(message)) {
    return `${message} — your account may not be an admin in the database. Check the role on your row in the profiles table.`;
  }
  return message;
}
