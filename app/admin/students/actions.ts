"use server";

import { revalidatePath } from "next/cache";
import { attempt, type SaveState } from "@/lib/admin-result";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidPhone, normalisePhone, phoneToEmail } from "@/lib/phone";
import { parseStudentLines } from "@/lib/parse-students";

const BACK = "/admin/students";

/**
 * Issues a student account.
 *
 * There is no public sign-up, so this is the only way an account comes into
 * existence. The account is created already confirmed: there is no inbox
 * behind the address, and a student waiting on a confirmation mail that can
 * never arrive would simply be locked out.
 */
export async function createStudent(
  _prev: SaveState | null,
  formData: FormData,
): Promise<SaveState> {
  return attempt("Student", async () => {
    await requireAdmin();
    const supabase = createAdminClient();

    const fullName = String(formData.get("full_name") ?? "").trim();
    const rollNo = String(formData.get("roll_no") ?? "").trim();
    const phoneRaw = String(formData.get("phone") ?? "");
    const password = String(formData.get("password") ?? "");

    if (!fullName) throw new Error("The student's name is required");
    if (!isValidPhone(phoneRaw)) {
      throw new Error(`"${phoneRaw}" is not a 10-digit Indian mobile number`);
    }
    if (password.length < 6) {
      throw new Error("The password must be at least 6 characters");
    }

    const phone = normalisePhone(phoneRaw);

    const { data: created, error } = await supabase.auth.admin.createUser({
      email: phoneToEmail(phone),
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, roll_no: rollNo, phone },
    });

    if (error) {
      if (/already/i.test(error.message)) {
        throw new Error(`${phone} already has an account. Reset its password instead.`);
      }
      throw new Error(error.message);
    }

    // The signup trigger fills the profile from user_metadata, but it runs
    // before this returns; writing the fields again makes the row correct even
    // if that trigger is missing on an older database.
    await supabase
      .from("profiles")
      .update({ full_name: fullName, roll_no: rollNo, phone })
      .eq("id", created.user.id);

    revalidatePath(BACK);
    return `${fullName} — ${phone}`;
  });
}

/** Sets a new password for a student who has forgotten theirs. */
export async function resetPassword(
  _prev: SaveState | null,
  formData: FormData,
): Promise<SaveState> {
  return attempt("Password", async () => {
    await requireAdmin();
    const supabase = createAdminClient();

    const id = String(formData.get("id"));
    const password = String(formData.get("password") ?? "");
    if (password.length < 6) throw new Error("The password must be at least 6 characters");

    const { error } = await supabase.auth.admin.updateUserById(id, { password });
    if (error) throw new Error(error.message);

    revalidatePath(BACK);
    return "changed";
  });
}

/**
 * Turns an account off, or back on.
 *
 * Deleting would take the student's results with it, which is usually not what
 * an institute wants when someone leaves a batch.
 */
export async function setActive(
  _prev: SaveState | null,
  formData: FormData,
): Promise<SaveState> {
  return attempt("Account", async () => {
    await requireAdmin();
    const supabase = createAdminClient();

    const id = String(formData.get("id"));
    const active = formData.get("active") === "true";

    const { data: updated, error } = await supabase
      .from("profiles")
      .update({ is_active: active })
      .eq("id", id)
      .select("id");

    if (error) throw new Error(error.message);
    if (!updated?.length) throw new Error("That account no longer exists");

    // Banning at the auth layer too, so an already-signed-in student cannot
    // keep using the session they had before being switched off.
    await supabase.auth.admin.updateUserById(id, {
      ban_duration: active ? "none" : "87600h",
    });

    revalidatePath(BACK);
    return active ? "switched on" : "switched off";
  });
}

/**
 * Creates many accounts from a pasted list or an uploaded CSV.
 *
 * The whole list is validated first, so a bad line stops everything before a
 * single account exists. After that the accounts are made one at a time and
 * the result says exactly how many were created and which numbers were
 * already taken — a partial run has to be legible, because the admin has to
 * know who still needs an account.
 */
export async function importStudents(
  _prev: SaveState | null,
  formData: FormData,
): Promise<SaveState> {
  return attempt("Students", async () => {
    await requireAdmin();
    const supabase = createAdminClient();

    const parsed = parseStudentLines(String(formData.get("bulk") ?? ""));

    let made = 0;
    const skipped: string[] = [];
    const failed: string[] = [];

    for (const student of parsed) {
      const { data: created, error } = await supabase.auth.admin.createUser({
        email: phoneToEmail(student.phone),
        password: student.password,
        email_confirm: true,
        user_metadata: {
          full_name: student.fullName,
          roll_no: student.rollNo,
          phone: student.phone,
        },
      });

      if (error) {
        if (/already/i.test(error.message)) skipped.push(student.phone);
        else failed.push(`${student.phone} (${error.message})`);
        continue;
      }

      await supabase
        .from("profiles")
        .update({
          full_name: student.fullName,
          roll_no: student.rollNo,
          phone: student.phone,
        })
        .eq("id", created.user.id);

      made++;
    }

    revalidatePath(BACK);

    const parts = [`${made} created`];
    if (skipped.length) parts.push(`${skipped.length} already had accounts (${skipped.join(", ")})`);
    if (failed.length) parts.push(`${failed.length} failed: ${failed.join("; ")}`);
    return parts.join(" · ");
  });
}
