import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Supabase client for server components and route handlers. Reads the signed-in
 * user from cookies, so RLS applies as that user.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // Middleware refreshes the session instead, so this is safe.
          }
        },
      },
    },
  );
}
