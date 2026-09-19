"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "watch-diagrams";
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Uploads a picture and hands back its public link.
 *
 * The upload runs in the browser against Supabase Storage, so a large image
 * never travels through a server action's body. Writing to the bucket is
 * restricted to admins by the storage policy, not by this component being
 * hidden — a hidden button is never the security boundary.
 */
export function ImageUpload({
  onUploaded,
  label = "Upload a picture…",
  hint,
}: {
  onUploaded: (url: string) => void;
  label?: string;
  hint?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("That is not a picture. Choose a PNG, JPG or WEBP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(
        `That picture is ${(file.size / 1024 / 1024).toFixed(1)} MB. Keep it under 5 MB.`,
      );
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      // Date and a random name: uploading a second file called diagram.png must
      // not quietly replace the first one, which another paper may still show.
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "31536000", upsert: false });

      if (upErr) throw new Error(upErr.message);

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onUploaded(data.publicUrl);
    } catch (e) {
      setError(
        e instanceof Error
          ? `Upload failed: ${e.message}. Check that the "watch-diagrams" bucket exists and is public.`
          : "Upload failed.",
      );
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        className="rounded border border-gray-400 bg-white px-4 py-1.5 text-[12px] font-semibold
                   text-gray-800 hover:bg-gray-100 disabled:opacity-50"
      >
        {busy ? "Uploading…" : label}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      {hint && <span className="ml-2 text-[11px] text-gray-500">{hint}</span>}
      {error && <p className="mt-1 text-[11px] font-semibold text-red-700">{error}</p>}
    </div>
  );
}
