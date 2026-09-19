import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export interface Profile {
  id: string;
  full_name: string;
  roll_no: string;
  phone: string;
  role: "student" | "admin";
  is_active: boolean;
}

/** True once the Supabase environment variables are present. */
export function isConfigured(): boolean {
  return missingConfig().length === 0;
}

/** Which environment variables still need setting, for the setup guide. */
export function missingConfig(): string[] {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  return required.filter((name) => !process.env[name]);
}

/**
 * The signed-in user's profile, or null when signed out.
 *
 * An account the institute has switched off counts as signed out here, on
 * every request. The ban at the auth layer only stops NEW sign-ins; a session
 * issued before the switch was flipped stays valid until its token expires,
 * so without this check a switched-off student kept sitting papers — and
 * their attempts kept entering the cohort — for up to an hour.
 */
export async function getProfile(): Promise<Profile | null> {
  const { profile } = await readProfile();
  return profile;
}

/**
 * One lookup per request. A layout and its page both ask who is signed in,
 * and without this each asked the auth server and the database again.
 */
const readProfile = cache(async (): Promise<{ profile: Profile | null; inactive: boolean }> => {
  if (!isConfigured()) return { profile: null, inactive: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { profile: null, inactive: false };

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, roll_no, phone, role, is_active")
    .eq("id", user.id)
    .single();

  const profile = data as Profile | null;
  if (!profile) return { profile: null, inactive: false };
  if (profile.is_active === false) return { profile: null, inactive: true };
  return { profile, inactive: false };
});

/**
 * Sends signed-out visitors to the login page. A switched-off account is told
 * so there, rather than shown a login form that will refuse it without saying
 * why.
 */
export async function requireUser(next = "/dashboard"): Promise<Profile> {
  const { profile, inactive } = await readProfile();
  if (inactive) redirect("/login?error=inactive");
  if (!profile) redirect(`/login?next=${encodeURIComponent(next)}`);
  return profile;
}

/**
 * Guards the admin area. This runs on the server on every admin page — the
 * middleware redirect is only a convenience, never the real check.
 *
 * A signed-in student who types /admin gets a plain "not found". Nothing links
 * to the panel, and a redirect that said "not an admin" would confirm to a
 * curious student that the panel exists at that address.
 */
export async function requireAdmin(next = "/admin"): Promise<Profile> {
  const profile = await requireUser(next);
  if (profile.role !== "admin") notFound();
  return profile;
}
