"use server";

import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidPhone, normalisePhone, phoneToEmail } from "@/lib/phone";
import { DEVICE_COOKIE } from "@/lib/login-guard";
import { logAction } from "@/lib/audit";

export type SignUpResult = { ok: true } | { ok: false; error: string };

const NAME_RE = /^[\p{L}\p{M} .'-]+$/u;
/** Sign-ups allowed from one address in an hour: enough for a family, not for a script. */
const PER_HOUR = 5;

/**
 * A student makes their own account: name, mobile number, password. No
 * OTP: the number is the login ID, nothing is sent to it, and a wrong
 * number only locks its owner out of a free account. The account starts
 * with no package; the free mock is open, and a package is bought or
 * added by the institute.
 *
 * The account is made with the server's key and marked issued, as the
 * institute's are, so the profile trigger switches it on; the profile
 * records that the student made it themselves.
 */
export async function signUp(_prev: SignUpResult | null, formData: FormData): Promise<SignUpResult> {
  // A field people never see; a script filling every field trips it.
  if (String(formData.get("website") ?? "")) return { ok: false, error: "Could not create the account." };

  const fullName = String(formData.get("full_name") ?? "").trim().replace(/\s+/g, " ");
  const phoneRaw = String(formData.get("phone") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (fullName.length < 2 || fullName.length > 60 || !NAME_RE.test(fullName)) return { ok: false, error: "Enter your name as it is on your ID (letters only)." };
  if (!isValidPhone(phoneRaw)) return { ok: false, error: "Enter your 10-digit mobile number. It becomes your login ID." };
  if (password.length < 6) return { ok: false, error: "The password must be at least 6 characters." };
  if (password !== confirm) return { ok: false, error: "The two passwords do not match." };
  const phone = normalisePhone(phoneRaw);

  const admin = createAdminClient();

  // A few per address per hour.
  const ip = ((await headers()).get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  try {
    const since = new Date(Date.now() - 3600000).toISOString();
    const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("signup_ip", ip).gte("created_at", since);
    if ((count ?? 0) >= PER_HOUR) return { ok: false, error: "Too many accounts from this connection. Try again in an hour, or ask at the institute." };
  } catch {
    // Without the column the check is skipped; the account is still made.
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email: phoneToEmail(phone),
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone },
    app_metadata: { issued: true, self: true },
  });
  if (error || !created.user) {
    if (error && /already/i.test(error.message)) {
      return { ok: false, error: "This mobile number already has an account. Sign in instead, or ask at the institute for a new password." };
    }
    return { ok: false, error: "Could not create the account. Try again in a moment." };
  }

  await admin
    .from("profiles")
    .update({ full_name: fullName, phone, is_active: true, signup_source: "self", signup_ip: ip })
    .eq("id", created.user.id)
    .then(async (r) => {
      // An older database without signup_source / signup_ip: keep the rest.
      if (r.error) await admin.from("profiles").update({ full_name: fullName, phone, is_active: true }).eq("id", created.user.id);
    });

  // Signed in at once, on this device.
  const supabase = await createClient();
  const { data: signed, error: signInError } = await supabase.auth.signInWithPassword({ email: phoneToEmail(phone), password });
  if (signInError || !signed.user) return { ok: true };
  try {
    const device = crypto.randomUUID();
    const { error: stampError } = await admin.from("profiles").update({ session_id: device }).eq("id", signed.user.id);
    if (!stampError) {
      (await cookies()).set(DEVICE_COOKIE, device, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
  } catch {
    // The stamp is a courtesy; the account stands.
  }
  await logAction("Student signed up", `${fullName} (${phone})`).catch(() => {});
  return { ok: true };
}
