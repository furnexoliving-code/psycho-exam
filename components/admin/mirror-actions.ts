"use server";

import { requireEditor } from "@/lib/auth";
import { imageHost } from "@/lib/images/host";
import { mirrorObject, nameOfPublicUrl } from "@/lib/images/mirror";
import { r2Missing, r2Settings } from "@/lib/images/r2";

export interface MirrorOutcome {
  ok: boolean;
  /** False when there was nothing to do: R2 is not set up, so Supabase serves the pictures. */
  copied: boolean;
  error?: string;
  /** False when uploading again cannot help: the set-up itself is wrong. */
  retryable?: boolean;
}

/**
 * Copies a picture the admin just uploaded to R2, so the portal can serve
 * it from there (lib/images/mirror.ts). Called from the browser right after
 * the upload, by any account that may upload at all.
 */
export async function mirrorUploadedPicture(url: string): Promise<MirrorOutcome> {
  await requireEditor();
  if (!r2Settings()) {
    // Served from the picture domain, yet nothing to copy with: the picture
    // would never show. Say so now, not when a student opens the paper.
    if (imageHost()) {
      return {
        ok: false,
        copied: false,
        retryable: false,
        error: `pictures are served from ${imageHost()}, but R2 is not set up: set ${r2Missing().join(", ")} in Vercel and redeploy, or remove NEXT_PUBLIC_IMAGE_HOST`,
      };
    }
    return { ok: true, copied: false };
  }
  const name = nameOfPublicUrl(String(url ?? ""));
  if (!name) return { ok: false, copied: false, error: "not a link into the pictures bucket" };
  try {
    await mirrorObject(name);
    return { ok: true, copied: true };
  } catch (e) {
    return { ok: false, copied: false, retryable: true, error: e instanceof Error ? e.message : String(e) };
  }
}
