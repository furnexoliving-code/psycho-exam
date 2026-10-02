"use client";

import { createClient } from "@/lib/supabase/client";

const BUCKET = "watch-diagrams";
export const MAX_PICTURE_BYTES = 5 * 1024 * 1024;

/**
 * Uploads one picture from the browser to Supabase Storage and returns its
 * public link.
 *
 * Done in the browser so a large image never travels through a server
 * action's body. Writing to the bucket is restricted by the storage policy
 * to the admin and the editor, not by this code being reachable — a hidden
 * button is never the security boundary.
 *
 * Throws with a message fit to show: the file not being a picture, too
 * large, or the upload itself failing.
 */
export async function uploadPicture(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`"${file.name}" is not a picture. Choose a PNG, JPG or WEBP.`);
  }
  if (file.size > MAX_PICTURE_BYTES) {
    throw new Error(
      `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB. Keep each picture under 5 MB.`,
    );
  }

  const supabase = createClient();
  // Date and a random name: uploading a second file called diagram.png must
  // not quietly replace the first one, which another paper may still show.
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "31536000", upsert: false });
  if (error) {
    throw new Error(
      `Upload failed: ${error.message}. Check that the "${BUCKET}" bucket exists and is public.`,
    );
  }

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Files in the order their names sort, so q01.png … q60.png become
 * questions 1 … 60 whatever order the file picker handed them over in.
 * Numbers inside names compare as numbers: q2 comes before q10.
 */
export function sortByName<T extends { name: string }>(files: T[]): T[] {
  return [...files].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }),
  );
}
