/**
 * How a refused copy is described, shared by the server that records it
 * (lib/images/mirror.ts) and the panel that shows it. Kept apart from the
 * mirror so the panel's browser code never pulls the server's in.
 */
export interface Failure {
  name: string;
  error: string;
}

/**
 * The two reasons no retry can mend: the bucket lists the picture but no
 * longer holds it, or its name cannot be carried. supabase/images-r2.sql
 * counts them by the same words.
 */
export const NOT_IN_BUCKET = "not in the Supabase bucket";
export const BAD_NAME = "a name the copy cannot carry";

/** True for a failure no retry can mend. */
export function isMissing(failure: Failure): boolean {
  return failure.error.startsWith(NOT_IN_BUCKET) || failure.error.startsWith(BAD_NAME);
}
