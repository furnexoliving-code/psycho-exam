"use server";

import { revalidatePath } from "next/cache";
import { attempt, type SaveState } from "@/lib/admin-result";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidPhone, normalisePhone, phoneToEmail } from "@/lib/phone";
import { IMPORT_BATCH, parseStudentLines } from "@/lib/parse-students";
import { HELPER_ROLES, isHelperRole } from "./helpers";
import { logAction } from "@/lib/audit";
import { indianDay } from "@/lib/format-time";
import { removePhoto, savePhoto } from "@/lib/photo";
import { defaultPackage, enrollNewStudent, grantToMany, studentsWithoutPackage } from "@/lib/packages";
import { cohortsChanged } from "@/lib/wt/cohorts";

/** A validity date off a form: YYYY-MM-DD, or null for none. */
function validityOf(raw: FormDataEntryValue | null): string | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("The validity date must be a date");
  return value;
}

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
    const phoneRaw = String(formData.get("phone") ?? "");
    const password = String(formData.get("password") ?? "");
    const validUntil = validityOf(formData.get("valid_until"));

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
      user_metadata: { full_name: fullName, phone },
      // Only the server can write app_metadata. The profile trigger switches
      // an account on only when this mark is present, so an account made any
      // other way — the auth API is public — starts life switched off.
      app_metadata: { issued: true },
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
    // Switched on explicitly as well: an account the institute issues is
    // on from the first moment, whatever version of the trigger the
    // database runs.
    await supabase
      .from("profiles")
      .update({ full_name: fullName, phone, is_active: true, valid_until: validUntil })
      .eq("id", created.user.id);

    // The package comes with the account, so nothing is left to give one by one.
    const pkg = await enrollNewStudent(created.user.id, String(formData.get("package") ?? ""), validUntil);

    await logAction("Student created", `${fullName} (${phone})${validUntil ? `, valid till ${validUntil}` : ""}${pkg ? `, ${pkg.name}` : ", no package"}`);
    revalidatePath(BACK);
    return `${fullName} — ${phone}${pkg ? ` · ${pkg.name}` : ""}`;
  });
}

/**
 * Gives the default package to every switched-on student who has none:
 * the accounts made before packages existed, or made without one. Each
 * runs till the account's validity date, or without expiry.
 */
export async function givePackageToAll(
  _prev: SaveState | null,
  _formData: FormData,
): Promise<SaveState> {
  return attempt("Packages", async () => {
    await requireAdmin();
    const pkg = await defaultPackage();
    if (!pkg) throw new Error("No published package to give. Make one under Packages first.");
    const missing = await studentsWithoutPackage();
    if (missing.length === 0) return "every student already has a package";
    // One insert per two hundred, not one per student: hundreds of
    // accounts must finish inside the time a server action is allowed.
    const given = await grantToMany(missing, pkg, "Given to all students without a package");
    await logAction("Package given to all", `${pkg.name} to ${given} student${given === 1 ? "" : "s"} who had none`);
    revalidatePath(BACK);
    return `${pkg.name} given to ${given} student${given === 1 ? "" : "s"}`;
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
    await studentOnly(supabase, id);

    const { error } = await supabase.auth.admin.updateUserById(id, { password });
    if (error) throw new Error(error.message);

    await logAction("Password reset", `student ${id}`);
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
    await studentOnly(supabase, id);

    const { data: updated, error } = await supabase
      .from("profiles")
      .update({ is_active: active })
      .eq("id", id)
      .select("id");

    if (error) throw new Error(error.message);
    if (!updated?.length) throw new Error("That account no longer exists");

    // Banning at the auth layer too, so an already-signed-in student cannot
    // keep using the session they had before being switched off.
    const { error: banError } = await supabase.auth.admin.updateUserById(id, {
      ban_duration: active ? "none" : "87600h",
    });
    // The profile flag alone already signs the student out on their next
    // request; the ban is the second lock, and a failure to set it must not
    // be reported as "switched off" as if both had held.
    if (banError) {
      throw new Error(`The account flag is saved, but the sign-in block failed: ${banError.message}`);
    }

    await logAction(active ? "Account switched on" : "Account switched off", `student ${id}`);
    revalidatePath(BACK);
    return active ? "switched on" : "switched off";
  });
}

/**
 * Removes a student's account for good, and their results with it.
 *
 * Switching off is the usual way to part with a student, because it keeps
 * their results; this is for an account made by mistake or one the
 * institute must not keep. The attempts and sittings go first, on purpose:
 * left behind they would sit in every paper's cohort as "Not signed in",
 * still moving everyone else's mean and T-score. Admin only, by role in
 * the section — a staff account never reaches this.
 */
export async function deleteStudent(
  _prev: SaveState | null,
  formData: FormData,
): Promise<SaveState> {
  return attempt("Account", async () => {
    await requireAdmin();
    const supabase = createAdminClient();

    const id = String(formData.get("id"));
    await studentOnly(supabase, id);

    const { error: sittings } = await supabase.from("watch_sessions").delete().eq("user_id", id);
    if (sittings) throw new Error(sittings.message);
    const { error: attempts } = await supabase.from("watch_attempts").delete().eq("user_id", id);
    // Their attempts counted in every paper's cohort until now.
    cohortsChanged();
    if (attempts) throw new Error(attempts.message);

    // The profile row goes with the auth user (on delete cascade).
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) throw new Error(error.message);

    await logAction("Student deleted", `student ${id}, with their results`);
    revalidatePath(BACK);
    return "deleted";
  });
}

/**
 * These actions manage STUDENTS. The list never offers an admin's row, but an
 * action is a public endpoint: a posted admin id would switch off — or reset
 * the password of — the only account that can switch it back on.
 */
async function studentOnly(
  supabase: ReturnType<typeof createAdminClient>,
  id: string,
): Promise<void> {
  const { data } = await supabase.from("profiles").select("role").eq("id", id).maybeSingle();
  if (!data) throw new Error("That account no longer exists");
  if (data.role !== "student") {
    throw new Error("Admin accounts are not managed from here");
  }
}

/** How many accounts are created at once within a batch. */
const IMPORT_CHUNK = 8;

/** What one batch of the import reports back. */
export interface ImportOutcome {
  made: number;
  skipped: string[];
  failed: string[];
  error?: string;
}

/**
 * Creates the accounts in one batch of a pasted list or an uploaded CSV.
 *
 * The browser has already checked the whole list, so a bad line stops
 * everything before a single account exists, and sends it here a batch at a
 * time (IMPORT_BATCH lines): one call that made five thousand accounts
 * would outlive the hosting's limit on a request, and die with no word on
 * which accounts existed. The batch is checked again here, since an action
 * is a public endpoint. The outcome says exactly how many were created and
 * which numbers were already taken — a partial run has to be legible,
 * because the admin has to know who still needs an account.
 */
export async function importStudentBatch(
  lines: string,
  /** The last batch of the run: only then is the page's list refreshed. */
  final = true,
  /** The validity date for every account in the run, or none. */
  validUntilRaw = "",
  /** The package every account in the run starts with: a slug, blank for the default, "none" for nothing. */
  packageSlug = "",
): Promise<ImportOutcome> {
  const outcome: ImportOutcome = { made: 0, skipped: [], failed: [] };
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const validUntil = validityOf(validUntilRaw);

    const parsed = parseStudentLines(lines);
    if (parsed.length > IMPORT_BATCH) {
      throw new Error(`At most ${IMPORT_BATCH} students in one batch`);
    }

    // A few at a time rather than one after another: accounts made serially
    // took far longer than the request was allowed.
    for (let i = 0; i < parsed.length; i += IMPORT_CHUNK) {
      const chunk = parsed.slice(i, i + IMPORT_CHUNK);
      await Promise.all(
        chunk.map(async (student) => {
          const { data: created, error } = await supabase.auth.admin.createUser({
            email: phoneToEmail(student.phone),
            password: student.password,
            email_confirm: true,
            app_metadata: { issued: true },
            user_metadata: {
              full_name: student.fullName,
              phone: student.phone,
            },
          });

          if (error) {
            if (/already/i.test(error.message)) outcome.skipped.push(student.phone);
            else outcome.failed.push(`${student.phone} (${error.message})`);
            return;
          }

          // The signup trigger fills the profile from user_metadata; writing
          // the fields again makes the row correct even if that trigger is
          // missing on an older database. Switched on explicitly too: every
          // imported account is ready to sign in, with nothing to flip one
          // by one afterwards.
          await supabase
            .from("profiles")
            .update({
              full_name: student.fullName,
              phone: student.phone,
              is_active: true,
              valid_until: validUntil,
            })
            .eq("id", created.user.id);
          await enrollNewStudent(created.user.id, packageSlug, validUntil);

          outcome.made++;
        }),
      );
    }

    if (outcome.made > 0) {
      await logAction("Students imported", `${outcome.made} account${outcome.made === 1 ? "" : "s"}${validUntil ? `, valid till ${validUntil}` : ""}`);
    }
    if (final) revalidatePath(BACK);
  } catch (error) {
    // A redirect (to the second-factor page) is not a failure to report.
    if (typeof (error as { digest?: unknown })?.digest === "string") throw error;
    outcome.error = error instanceof Error ? error.message : String(error);
  }
  return outcome;
}

/**
 * Issues a helper account: staff, who may reset students' passwords, or an
 * editor, who may write papers — and nothing else in either case. Made
 * exactly like a student — mobile number and password — with the role set
 * once the account exists.
 */
export async function createStaff(
  _prev: SaveState | null,
  formData: FormData,
): Promise<SaveState> {
  return attempt("Helper account", async () => {
    await requireAdmin();
    const supabase = createAdminClient();

    const fullName = String(formData.get("full_name") ?? "").trim();
    const phoneRaw = String(formData.get("phone") ?? "");
    const password = String(formData.get("password") ?? "");
    const role = String(formData.get("role") ?? "");

    if (!fullName) throw new Error("The name is required");
    if (!isHelperRole(role)) throw new Error("Choose what the account is for");
    if (!isValidPhone(phoneRaw)) {
      throw new Error(`"${phoneRaw}" is not a 10-digit Indian mobile number`);
    }
    if (password.length < 8) throw new Error("A helper's password must be at least 8 characters");

    const phone = normalisePhone(phoneRaw);
    const { data: created, error } = await supabase.auth.admin.createUser({
      email: phoneToEmail(phone),
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone },
      app_metadata: { issued: true },
    });
    if (error) {
      if (/already/i.test(error.message)) {
        throw new Error(`${phone} already has an account.`);
      }
      throw new Error(error.message);
    }

    const { data: updated, error: roleError } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone, role, is_active: true })
      .eq("id", created.user.id)
      .select("id");
    if (roleError) {
      // The account exists with no role but student's; it must not stay as
      // a student who can sit papers, so it is removed again.
      await supabase.auth.admin.deleteUser(created.user.id);
      throw new Error(
        /role_check|violates check/i.test(roleError.message)
          ? `The database does not know the ${role} role yet — run the latest watch-table-schema.sql, then try again.`
          : roleError.message,
      );
    }
    if (!updated?.length) throw new Error("The account was made but its role could not be set");

    await logAction("Helper account created", `${fullName} (${phone}) as ${role}`);
    revalidatePath(BACK);
    return `${fullName} — ${phone}. They sign in at ${HELPER_ROLES[role].home}.`;
  });
}

/** Removes a helper account entirely. Their sign-in stops at once. */
export async function removeStaff(
  _prev: SaveState | null,
  formData: FormData,
): Promise<SaveState> {
  return attempt("Helper account", async () => {
    await requireAdmin();
    const supabase = createAdminClient();

    const id = String(formData.get("id"));
    const { data } = await supabase.from("profiles").select("role").eq("id", id).maybeSingle();
    if (!data) throw new Error("That account no longer exists");
    if (!isHelperRole(data.role)) throw new Error("Only a helper account can be removed here");

    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) throw new Error(error.message);

    await logAction("Helper account removed", `${data.role} ${id}`);
    revalidatePath(BACK);
    return "removed";
  });
}

/**
 * Sets, moves or clears the last day a student may sign in. Past it the
 * account is refused like a switched-off one, and the results stay.
 */
export async function setValidity(
  _prev: SaveState | null,
  formData: FormData,
): Promise<SaveState> {
  return attempt("Validity", async () => {
    await requireAdmin();
    const supabase = createAdminClient();

    const id = String(formData.get("id"));
    const validUntil = validityOf(formData.get("valid_until"));
    await studentOnly(supabase, id);

    const { data: updated, error } = await supabase
      .from("profiles")
      .update({ valid_until: validUntil })
      .eq("id", id)
      .select("id");
    if (error) throw new Error(error.message);
    if (!updated?.length) throw new Error("That account no longer exists");

    await logAction("Validity changed", `student ${id}: ${validUntil ?? "no end date"}`);
    revalidatePath(BACK);
    return validUntil
      ? validUntil < indianDay(Date.now())
        ? `ends ${validUntil} — already past, the account is now refused`
        : `till ${validUntil}`
      : "no end date";
  });
}

/**
 * One validity date for every student at once — the usual case when a
 * course's end date moves. Admin only.
 */
export async function setValidityForAll(
  _prev: SaveState | null,
  formData: FormData,
): Promise<SaveState> {
  return attempt("Validity for all students", async () => {
    await requireAdmin();
    const supabase = createAdminClient();
    const validUntil = validityOf(formData.get("valid_until"));
    if (String(formData.get("confirm") ?? "") !== "ALL") {
      throw new Error('Type ALL in the box to confirm: this changes every student account');
    }
    const { data, error } = await supabase
      .from("profiles")
      .update({ valid_until: validUntil })
      .eq("role", "student")
      .select("id");
    if (error) throw new Error(error.message);
    await logAction("Validity set for all students", `${data?.length ?? 0} accounts: ${validUntil ?? "no end date"}`);
    revalidatePath(BACK);
    return `${data?.length ?? 0} accounts — ${validUntil ? `till ${validUntil}` : "no end date"}`;
  });
}

/** Replaces a student's photo from the panel. */
export async function setStudentPhoto(_prev: SaveState | null, formData: FormData): Promise<SaveState> {
  return attempt("Photo", async () => {
    await requireAdmin();
    const id = String(formData.get("id"));
    await studentOnly(createAdminClient(), id);
    const file = formData.get("photo");
    if (!(file instanceof File) || file.size === 0) throw new Error("Choose a picture first");
    await savePhoto(id, file);
    await logAction("student.photo", `set for ${id}`);
    revalidatePath(`${BACK}/${id}`);
  });
}

/** Removes a student's photo from the panel. */
export async function removeStudentPhoto(_prev: SaveState | null, formData: FormData): Promise<SaveState> {
  return attempt("Photo", async () => {
    await requireAdmin();
    const id = String(formData.get("id"));
    await studentOnly(createAdminClient(), id);
    await removePhoto(id);
    await logAction("student.photo", `removed for ${id}`);
    revalidatePath(`${BACK}/${id}`);
    return "removed.";
  });
}
