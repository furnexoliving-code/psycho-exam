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

interface Session {
  profile: Profile | null;
  inactive: boolean;
  /** The session's assurance level: aal2 once a second factor has been passed. */
  aal: string | null;
}

/**
 * One lookup per request. A layout and its page both ask who is signed in,
 * and without this each asked the auth server and the database again.
 *
 * The token is verified here, against the project's public signing key, so
 * a valid session costs no round trip to the auth server. (A project still
 * on a shared secret is verified by the auth server instead — the same cost
 * as before, never less safe.) A deleted account has no profile row and a
 * switched-off one is refused below, so a token that outlives its account
 * still opens nothing.
 */
const readProfile = cache(async (): Promise<Session> => {
  if (!isConfigured()) return { profile: null, inactive: false, aal: null };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return { profile: null, inactive: false, aal: null };

  const { data: row } = await supabase
    .from("profiles")
    .select("id, full_name, roll_no, phone, role, is_active")
    .eq("id", claims.sub)
    .single();

  const profile = row as Profile | null;
  const aal = typeof claims.aal === "string" ? claims.aal : "aal1";
  if (!profile) return { profile: null, inactive: false, aal };
  if (profile.is_active === false) return { profile: null, inactive: true, aal };
  return { profile, inactive: false, aal };
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
 * The admin account, by role alone — the first of the two locks on the panel.
 * Only the pages that SET UP or PASS the second lock use this; everything
 * else uses requireAdmin below.
 *
 * A signed-in student who types /admin gets a plain "not found". Nothing links
 * to the panel, and a redirect that said "not an admin" would confirm to a
 * curious student that the panel exists at that address.
 */
export async function requireAdminRole(next = "/admin"): Promise<Profile> {
  const profile = await requireUser(next);
  if (profile.role !== "admin") notFound();
  return profile;
}

/**
 * Guards the admin area: the admin role AND a second factor passed in this
 * session. This runs on the server on every admin page and inside every
 * admin action — the middleware redirect is only a convenience, never the
 * real check.
 *
 * A password can be guessed, phished or reused; the six-digit code from the
 * admin's own phone cannot. An admin who has not set the factor up yet is
 * sent to do so; one who has, but has not passed it in this session, is sent
 * to enter the code. Until then the panel — and every action behind it — is
 * closed.
 */
export async function requireAdmin(next = "/admin"): Promise<Profile> {
  const profile = await requireAdminRole(next);
  const { enrolled, passed } = await secondFactor();

  if (!enrolled) redirect("/admin/setup-2fa");
  if (!passed) redirect(`/admin/verify?next=${encodeURIComponent(next)}`);
  return profile;
}

export interface SecondFactor {
  /** A verified authenticator is on the account. */
  enrolled: boolean;
  /** This session has passed it. */
  passed: boolean;
}

/**
 * Where the admin stands with the second factor. The list of factors comes
 * from the auth server — one call per request, for admins only.
 */
export const secondFactor = cache(async (): Promise<SecondFactor> => {
  const { aal } = await readProfile();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  // Fail closed, and say so: an auth-server hiccup read as "not enrolled"
  // would send an enrolled admin into a set-up the server then refuses.
  if (error || !data) {
    throw new Error(`Could not check the authenticator: ${error?.message ?? "no answer"}`);
  }
  const enrolled = data.all.some((factor) => factor.status === "verified");
  return { enrolled, passed: enrolled && aal === "aal2" };
});

/**
 * True only for an admin who has passed the second factor in this session.
 * Anything that hands an admin more than a student gets — the answer key,
 * a draft paper — asks this, never the role alone.
 */
export async function isVerifiedAdmin(): Promise<boolean> {
  const { profile } = await readProfile();
  if (profile?.role !== "admin") return false;
  return (await secondFactor()).passed;
}
