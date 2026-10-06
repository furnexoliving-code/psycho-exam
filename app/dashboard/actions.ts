"use server";

import { revalidatePath } from "next/cache";
import { attempt, type SaveState } from "@/lib/admin-result";
import { requireUser } from "@/lib/auth";
import { removePhoto, savePhoto } from "@/lib/photo";

/**
 * A student's own photo: the one thing about the account that is theirs to
 * change. Name, mobile and roll number are the institute's to set.
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
