import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. It BYPASSES row level security, so it must only ever be
 * constructed inside server-only code — route handlers and server actions.
 *
 * It exists for the one thing students must not be able to do themselves: read
 * the answer key. Scoring happens here, on the server, and only the resulting
 * marks go back to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it in the Vercel project settings.",
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
