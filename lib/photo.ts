import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Candidate photos. Kept in a private bucket and read with the service
 * role, so the only way to a photo is the portal's own route, which checks
 * who is asking: the student themself, or the panel.
 */
export const PHOTO_BUCKET = "student-photos";
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** The portal's own address for a candidate's photo; null without one. */
export function photoUrlOf(profile: { id: string; photo_path: string | null } | null | undefined): string | null {
  if (!profile?.photo_path) return null;
  // The path changes with every upload, so the address does too and no
  // browser keeps showing the old picture.
  return `/api/photo/${profile.id}?v=${encodeURIComponent(profile.photo_path)}`;
}

/** Stores a photo for the account and records its path. Throws with a message fit to show. */
export async function savePhoto(userId: string, file: File): Promise<void> {
  const ext = TYPES[file.type];
  if (!ext) throw new Error("Choose a JPG, PNG or WEBP picture");
  if (file.size === 0) throw new Error("The file is empty");
  if (file.size > MAX_PHOTO_BYTES) throw new Error("Keep the photo under 2 MB");

  const supabase = createAdminClient();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type, cacheControl: "3600", upsert: false });
  if (error) throw new Error(`Upload failed: ${error.message}. Check that the "${PHOTO_BUCKET}" bucket exists.`);

  const { data: before } = await supabase.from("profiles").select("photo_path").eq("id", userId).maybeSingle();
  const { error: rowError } = await supabase.from("profiles").update({ photo_path: path }).eq("id", userId);
  if (rowError) throw new Error(rowError.message);
  if (before?.photo_path && before.photo_path !== path) {
    await supabase.storage.from(PHOTO_BUCKET).remove([before.photo_path as string]);
  }
}

/** Removes the account's photo, file and record. */
export async function removePhoto(userId: string): Promise<void> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("profiles").select("photo_path").eq("id", userId).maybeSingle();
  const { error } = await supabase.from("profiles").update({ photo_path: null }).eq("id", userId);
  if (error) throw new Error(error.message);
  if (data?.photo_path) await supabase.storage.from(PHOTO_BUCKET).remove([data.photo_path as string]);
}

/** The photo's bytes and type, for the route that serves it. */
export async function readPhoto(userId: string): Promise<{ bytes: ArrayBuffer; type: string } | null> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("profiles").select("photo_path").eq("id", userId).maybeSingle();
  const path = data?.photo_path as string | null | undefined;
  if (!path) return null;
  const { data: blob, error } = await supabase.storage.from(PHOTO_BUCKET).download(path);
  if (error || !blob) return null;
  const ext = path.split(".").pop() ?? "jpg";
  const type = Object.entries(TYPES).find(([, e]) => e === ext)?.[0] ?? "image/jpeg";
  return { bytes: await blob.arrayBuffer(), type };
}
