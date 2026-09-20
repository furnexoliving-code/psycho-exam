import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "./supabase/server";

/**
 * Who an account is. Beyond the student and the admin there are two kinds of
 * helper, each with one job: staff reset students' passwords, an editor
 * writes and publishes papers. Neither sees results or accounts.
 */
export type Role = "student" | "admin" | "staff" | "editor";

export interface Profile {
  id: string;
  full_name: string;
  roll_no: string;
  phone: string;
  role: Role;
  is_active: boolean;
}

/**
 * The panel's sections and who may open each. The admin opens everything;
 * a helper opens only the section that is their job. Every page and every
 * action names its section, so the rule lives here once.
 */
export type Section = "admin" | "papers" | "passwords";

const SECTION_ROLES: Record<Section, readonly Role[]> = {
  admin: ["admin"],
  papers: ["admin", "editor"],
  passwords: ["admin", "staff"],
};

/** Every role that may enter the panel at all. */
export const PANEL_ROLES: readonly Role[] = ["admin", "staff", "editor"];

/** True when this role may open the section. */
export function mayOpen(role: Role, section: Section): boolean {
  return SECTION_ROLES[section].includes(role);
}

/** Where an account lands after signing in, or after passing the second factor. */
export function panelHome(role: Role): string {
  if (role === "staff") return "/admin/passwords";
  if (role === "editor") return "/admin/watch-table";
  return "/admin";
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
 * Any panel account, by role alone — the first of the two locks. Only the
 * pages that SET UP or PASS the second lock use this; everything else names
 * its section and uses requireSection below.
 *
 * A signed-in student who types /admin gets a plain "not found". Nothing links
 * to the panel, and a redirect that said "not an admin" would confirm to a
 * curious student that the panel exists at that address.
 */
export async function requirePanelRole(next = "/admin"): Promise<Profile> {
  const profile = await requireUser(next);
  if (!PANEL_ROLES.includes(profile.role)) notFound();
  return profile;
}

/**
 * Guards one section of the panel: a role that may open it AND a second
 * factor passed in this session. This runs on the server on every panel
 * page and inside every panel action — the middleware redirect is only a
 * convenience, never the real check.
 *
 * A password can be guessed, phished or reused; the six-digit code from the
 * account holder's own phone cannot. One who has not set the factor up yet
 * is sent to do so; one who has, but has not passed it in this session, is
 * sent to enter the code. Until then the section — and every action behind
 * it — is closed.
 *
 * A helper who types the address of a section that is not theirs gets the
 * same "not found" a student would: the panel never confirms what else it
 * holds.
 */
export async function requireSection(section: Section, next?: string): Promise<Profile> {
  const profile = await requirePanelRole(next ?? "/admin");
  if (!mayOpen(profile.role, section)) notFound();

  const back = next ?? panelHome(profile.role);
  const { enrolled, passed } = await secondFactor();
  if (!enrolled) redirect(`/admin/setup-2fa?next=${encodeURIComponent(back)}`);
  if (!passed) redirect(`/admin/verify?next=${encodeURIComponent(back)}`);
  return profile;
}

/**
 * The panel's frame, shared by every section: any panel role, and the
 * second factor passed. Which section the account may open is each page's
 * own check — a request can ask for a page without its layout.
 */
export async function requirePanel(): Promise<Profile> {
  const profile = await requirePanelRole("/admin");
  const back = panelHome(profile.role);
  const { enrolled, passed } = await secondFactor();
  if (!enrolled) redirect(`/admin/setup-2fa?next=${encodeURIComponent(back)}`);
  if (!passed) redirect(`/admin/verify?next=${encodeURIComponent(back)}`);
  return profile;
}

/** The admin alone: accounts, results, deleting a paper. */
export async function requireAdmin(next = "/admin"): Promise<Profile> {
  return requireSection("admin", next);
}

/** The admin or an editor: writing papers. */
export async function requireEditor(next = "/admin/watch-table"): Promise<Profile> {
  return requireSection("papers", next);
}

/** The admin or staff: resetting a student's password. */
export async function requireStaff(next = "/admin/passwords"): Promise<Profile> {
  return requireSection("passwords", next);
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
 * True only for an admin or editor who has passed the second factor in this
 * session. Anything that hands them more than a student gets — a draft
 * paper to preview, a marking with no sitting behind it — asks this, never
 * the role alone.
 */
export async function isVerifiedEditor(): Promise<boolean> {
  const { profile } = await readProfile();
  if (!profile || !mayOpen(profile.role, "papers")) return false;
  return (await secondFactor()).passed;
}
