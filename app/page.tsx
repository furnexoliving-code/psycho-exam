import { redirect } from "next/navigation";
import { getProfile, isConfigured } from "@/lib/auth";

/**
 * The portal's front door: the candidate's own page, or the login.
 *
 * There is deliberately no public landing page. The old one advertised a
 * sample paper and linked to the admin panel, which meant anyone who found
 * the address was shown where the staff entrance was. An admin reaches /admin
 * by typing it; nothing on the site points there.
 */
// A redirect, decided per request — never a prerendered page carrying a
// meta refresh. In production the middleware answers first.
export const dynamic = "force-dynamic";

export default async function Home() {
  if (!isConfigured()) redirect("/login");

  const profile = await getProfile();
  redirect(profile ? "/dashboard" : "/login");
}
