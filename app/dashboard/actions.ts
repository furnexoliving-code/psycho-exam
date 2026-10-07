"use server";

import { revalidatePath } from "next/cache";
import { attempt, type SaveState } from "@/lib/admin-result";
import { requireUser } from "@/lib/auth";
import { removePhoto, savePhoto } from "@/lib/photo";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * A student's own photo: the one thing about the account that is theirs to
 * change, and their name. The mobile number is the institute's to set.
 */
export async function updateMyPhoto(_prev: SaveState | null, formData: FormData): Promise<SaveState> {
  return attempt("Photo", async () => {
    const who = await requireUser();
    const file = formData.get("photo");
    if (!(file instanceof File) || file.size === 0) throw new Error("Choose a picture first");
    await savePhoto(who.id, file);
    revalidatePath("/dashboard");
  });
}

export async function removeMyPhoto(_prev: SaveState | null, formData: FormData): Promise<SaveState> {
  void formData;
  return attempt("Photo", async () => {
    const who = await requireUser();
    await removePhoto(who.id);
    revalidatePath("/dashboard");
    return "removed.";
  });
}

/** The student's own name. The mobile number stays the institute's to set. */
export async function updateMyName(_prev: SaveState | null, formData: FormData): Promise<SaveState> {
  return attempt("Name", async () => {
    const who = await requireUser("/profile");
    const name = String(formData.get("full_name") ?? "").replace(/\s+/g, " ").trim();
    if (name.length < 2 || name.length > 60) throw new Error("Write your full name (2 to 60 characters)");
    if (!/^[\p{L}\p{M} .'-]+$/u.test(name)) throw new Error("Letters, spaces and dots only");
    const admin = createAdminClient();
    const { error } = await admin.from("profiles").update({ full_name: name }).eq("id", who.id);
    if (error) throw new Error(error.message);
    await admin.auth.admin.updateUserById(who.id, { user_metadata: { full_name: name } }).catch(() => undefined);
    revalidatePath("/profile");
    revalidatePath("/dashboard");
    return `now ${name}.`;
  });
}
