"use server";

import { revalidatePath } from "next/cache";
import { attempt, type SaveState } from "@/lib/admin-result";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The one thing a staff account may do: give a student a new password.
 *
 * Checked here, in the action — the page hiding everything else is a
 * courtesy, never the boundary. Only a STUDENT's password: never an
 * admin's, never another staff member's.
 */
export async function resetStudentPassword(
  _prev: SaveState | null,
  formData: FormData,
): Promise<SaveState> {
  return attempt("Password", async () => {
    await requireStaff();
    const supabase = createAdminClient();

    const id = String(formData.get("id"));
    const password = String(formData.get("password") ?? "");
    if (password.length < 6) throw new Error("The password must be at least 6 characters");

    const { data: target } = await supabase
      .from("profiles")
      .select("role, full_name, phone")
      .eq("id", id)
      .maybeSingle();
    if (!target) throw new Error("That account no longer exists");
    if (target.role !== "student") throw new Error("Only a student's password can be reset here");

    const { error } = await supabase.auth.admin.updateUserById(id, { password });
    if (error) throw new Error(error.message);

    revalidatePath("/admin/passwords");
    return `changed for ${target.full_name || target.phone}`;
  });
}
