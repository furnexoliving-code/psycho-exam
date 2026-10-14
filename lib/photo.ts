import { createAdminClient } from "@/lib/supabase/admin";
import { THUMB_TYPE, makeThumb } from "@/lib/photo-thumb";

/**
 * Candidate photos. Kept in a private bucket and read with the service
 * role, so the only way to a photo is the portal's own route, which checks
 * who is asking: the student themself, or the panel.
 *
 * Every photo has a small copy beside it (see photo-thumb.ts). The header,
 * the exam screen and the scorecard show the small one; only the profile
 * page and the panel's student page ask for the full picture.
 */
export const PHOTO_BUCKET = "student-photos";
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export type PhotoSize = "thumb" | "full";

/** Where the small copy of a photo lives: beside the original, under its name. */
export function thumbPathOf(path: string): string {
  return `${path}.thumb.jpg`;
}

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** The portal's own address for a candidate's photo, small unless asked for the full picture; null without one. */
export function photoUrlOf(profile: { id: string; photo_path: string | null } | null | undefined, size: PhotoSize = "thumb"): string | null {
  if (!profile?.photo_path) return null;
  // The path changes with every upload, so the address does too and no
  // browser keeps showing the old picture.
  return `/api/photo/${profile.id}?v=${encodeURIComponent(profile.photo_path)}${size === "full" ? "&full=1" : ""}`;
}

/** Stores a photo for the account and records its path. Throws with a message fit to show. */
export async function savePhoto(userId: string, file: File): Promise<void> {
  const ext = TYPES[file.type];
  if (!ext) throw new Error("Choose a JPG, PNG or WEBP picture");
  if (file.size === 0) throw new Error("The file is empty");
  if (file.size > MAX_PHOTO_BYTES) throw new Error("Keep the photo under 2 MB");

  const original = Buffer.from(await file.arrayBuffer());
  // The small copy is best effort: a picture sharp cannot read is still
  // stored and shown as before, and the route serves the original for it.
  let small: Buffer | null = null;
  try {
    small = await makeThumb(original);
  } catch {
    small = null;
  }

  const supabase = createAdminClient();
  const bucket = supabase.storage.from(PHOTO_BUCKET);
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await bucket.upload(path, original, { contentType: file.type, cacheControl: "3600", upsert: false });
  if (error) throw new Error(`Upload failed: ${error.message}. Check that the "${PHOTO_BUCKET}" bucket exists.`);
  // Should this upload fail, the route makes a copy on first view.
  if (small) await bucket.upload(thumbPathOf(path), small, { contentType: THUMB_TYPE, cacheControl: "31536000", upsert: true });

  const { data: before } = await supabase.from("profiles").select("photo_path").eq("id", userId).maybeSingle();
  const { error: rowError } = await supabase.from("profiles").update({ photo_path: path }).eq("id", userId);
  if (rowError) throw new Error(rowError.message);
  if (before?.photo_path && before.photo_path !== path) {
    const old = before.photo_path as string;
    await bucket.remove([old, thumbPathOf(old)]);
  }
}

/** Removes the account's photo, file and record. */
export async function removePhoto(userId: string): Promise<void> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("profiles").select("photo_path").eq("id", userId).maybeSingle();
  const { error } = await supabase.from("profiles").update({ photo_path: null }).eq("id", userId);
  if (error) throw new Error(error.message);
  if (data?.photo_path) {
    const path = data.photo_path as string;
    await supabase.storage.from(PHOTO_BUCKET).remove([path, thumbPathOf(path)]);
  }
}

function typeOf(path: string): string {
  const ext = path.split(".").pop() ?? "jpg";
  return Object.entries(TYPES).find(([, e]) => e === ext)?.[0] ?? "image/jpeg";
}

/**
 * The photo's bytes and type, for the route that serves it: the small copy
 * by default, the original when asked. A photo uploaded before small
 * copies existed gets one made and kept on its first view.
 */
export async function readPhoto(userId: string, size: PhotoSize = "thumb"): Promise<{ bytes: Buffer; type: string } | null> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("profiles").select("photo_path").eq("id", userId).maybeSingle();
  const path = data?.photo_path as string | null | undefined;
  if (!path) return null;
  const bucket = supabase.storage.from(PHOTO_BUCKET);

  if (size === "thumb") {
    const { data: small } = await bucket.download(thumbPathOf(path));
    if (small) return { bytes: Buffer.from(await small.arrayBuffer()), type: THUMB_TYPE };
  }

  const { data: blob, error } = await bucket.download(path);
  if (error || !blob) return null;
  const original = Buffer.from(await blob.arrayBuffer());
  if (size === "full") return { bytes: original, type: typeOf(path) };

  try {
    const small = await makeThumb(original);
    // Kept for next time; two first views at once both upsert the same picture.
    await bucket.upload(thumbPathOf(path), small, { contentType: THUMB_TYPE, cacheControl: "31536000", upsert: true });
    return { bytes: small, type: THUMB_TYPE };
  } catch {
    // A picture sharp cannot read: serve it as it is, as before.
    return { bytes: original, type: typeOf(path) };
  }
}
