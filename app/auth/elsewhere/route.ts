import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DEVICE_COOKIE } from "@/lib/login-guard";
import { isConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Where a request from a device that is no longer the account's device
 * lands: signed out here, then told why on the login page.
 */
export async function GET(request: Request) {
  if (isConfigured()) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // The cookies are cleared below either way.
    }
  }
  (await cookies()).delete(DEVICE_COOKIE);
  return NextResponse.redirect(new URL("/login?error=elsewhere", request.url));
}
