"use client";

import { createClient } from "@/lib/supabase/client";
import { mirrorUploadedPicture } from "./mirror-actions";

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
  // An SVG is a document that can carry script, not a picture of a paper.
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    throw new Error(`"${file.name}" is not a picture the portal takes. Choose a PNG, JPG or WEBP.`);
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

  const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

  // The copy the portal serves (lib/images/host.ts). A failed copy fails
  // the upload: once the portal serves from R2, a link only Supabase can
  // answer is a broken picture on the exam screen. The file is in the
  // bucket all the same, so uploading again works, and Admin → Pictures
  // copies whatever is not copied yet on its next run.
  const mirrored = await mirrorUploadedPicture(url);
  if (!mirrored.ok) {
    throw new Error(
      `Uploaded, but the copy to the picture server failed: ${mirrored.error}.${mirrored.retryable === false ? "" : " Upload again, or open Admin → Pictures and press Copy."}`,
    );
  }

  return url;
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
