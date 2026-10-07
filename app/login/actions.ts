"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidPhone, normalisePhone, phoneToEmail } from "@/lib/phone";
import { clearFailures, DEVICE_COOKIE, lockedFor, noteFailure } from "@/lib/login-guard";

export type SignInResult = { ok: true } | { ok: false; error: string };

/**
 * Signs a candidate in. Done on the server so that wrong passwords can be
 * counted and the number locked after five, and so that a student's
 * account can be stamped with this device: from now on a request from any
 * other device is signed out. The panel roles are not stamped; an admin may
 * keep the panel open on two machines.
 */
export async function signIn(_prev: SignInResult | null, formData: FormData): Promise<SignInResult> {
  const raw = String(formData.get("phone") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!isValidPhone(raw)) return { ok: false, error: "Enter the 10-digit mobile number your institute gave you." };
  const phone = normalisePhone(raw);

  const wait = await lockedFor(phone);
  if (wait > 0) {
    const min = Math.max(1, Math.ceil(wait / 60));
    return { ok: false, error: `Too many wrong attempts. Try again in ${min} minute${min === 1 ? "" : "s"}.` };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: phoneToEmail(phone), password });
  if (error || !data.user) {
    if (error && /banned/i.test(error.message)) return { ok: false, error: "This account has been switched off by the institute." };
    const left = await noteFailure(phone);
    // Never say which half was wrong: that would confirm to a stranger
    // which mobile numbers have accounts.
    return {
      ok: false,
      error:
        left > 0
          ? `That mobile number and password do not match. ${left} ${left === 1 ? "try" : "tries"} left before a 10-minute wait.`
          : "That mobile number and password do not match. Too many wrong attempts: wait 10 minutes, then try again.",
    };
  }
  await clearFailures(phone);

  // One device at a time, for students.
  try {
    const admin = createAdminClient();
    const { data: profile } = await admin.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    if (profile?.role === "student") {
      const device = crypto.randomUUID();
      const { error: stampError } = await admin.from("profiles").update({ session_id: device }).eq("id", data.user.id);
      if (!stampError) {
        (await cookies()).set(DEVICE_COOKIE, device, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        });
      }
    }
  } catch {
    // Without the column (schema file not run yet) the stamp is skipped and
    // the sign-in stands.
  }
  return { ok: true };
}
