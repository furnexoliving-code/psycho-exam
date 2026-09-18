import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export interface Profile {
  id: string;
  full_name: string;
  roll_no: string;
  phone: string;
  role: "student" | "admin";
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

/** The signed-in user's profile, or null when signed out. */
export async function getProfile(): Promise<Profile | null> {
  if (!isConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, roll_no, phone, role")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
}

/** Sends signed-out visitors to the login page. */
export async function requireUser(next = "/dashboard"): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect(`/login?next=${encodeURIComponent(next)}`);
  return profile;
}

/**
 * Guards the admin area. This runs on the server on every admin page — the
 * middleware redirect is only a convenience, never the real check.
 */
export async function requireAdmin(next = "/admin"): Promise<Profile> {
  const profile = await requireUser(next);
  if (profile.role !== "admin") redirect("/dashboard?error=not-admin");
  return profile;
}
