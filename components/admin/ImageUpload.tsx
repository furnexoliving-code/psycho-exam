"use client";

import { useRef, useState } from "react";
import { uploadPicture } from "./upload";

/**
 * Uploads a picture and hands back its public link.
 *
 * The upload itself lives in `upload.ts`, shared with the multi-picture
 * uploads of the Perceptual Speed panel; this is the one-button form of it.
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
    setBusy(true);
    try {
      onUploaded(await uploadPicture(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
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
