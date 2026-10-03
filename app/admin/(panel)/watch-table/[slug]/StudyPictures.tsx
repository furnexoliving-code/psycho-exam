"use client";

import { useRef, useState } from "react";
import { sortByName, uploadPicture } from "@/components/admin/upload";
import { setStudyImages } from "../figure-actions";

/**
 * The Memory Test's study screens: one picture per part, shown for the
 * study time before that part's questions. Chosen all at once, in filename
 * order (study1.png, study2.png …), and replaced whole; a single picture
 * can be swapped by uploading it in its place.
 */
export function StudyPictures({ slug, images }: { slug: string; images: string[] }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement | null>(null);

  const apply = async (urls: string[]) => {
    setError(null);
    setBusy(true);
    const outcome = await setStudyImages(slug, urls);
    if (!outcome.ok) setError(outcome.error ?? "Failed");
    setBusy(false);
  };

  const choose = async (list: FileList | null) => {
    const files = sortByName(Array.from(list ?? []));
    if (files.length === 0) return;
    setError(null);
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const f of files) urls.push(await uploadPicture(f));
      const outcome = await setStudyImages(slug, urls);
      if (!outcome.ok) throw new Error(outcome.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      if (picker.current) picker.current.value = "";
    }
  };

  return (
    <div className="mt-3 rounded border border-gray-300 bg-gray-50 p-4">
      <p className="text-[13px] font-semibold text-gray-800">Study screen pictures — one per part</p>
      <p className="mt-1 text-[11px] text-gray-600">
        Name them in part order (study1.png, study2.png …) and choose them all at once.
        Part 1&apos;s picture is shown for the study time, then Part 1&apos;s questions; then
        Part 2&apos;s picture, and so on. Without pictures the questions open at once.
      </p>
      {images.length > 0 && (
        <ol className="mt-3 flex flex-wrap gap-3">
          {images.map((url, i) => (
            <li key={url} className="text-center text-[11px] text-gray-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-[90px] w-auto rounded border border-gray-300 bg-white" />
              Part {i + 1}
            </li>
          ))}
        </ol>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => picker.current?.click()}
          className="rounded border border-gray-400 bg-white px-4 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100 disabled:opacity-50"
        >
          {busy ? "Working…" : images.length ? "Replace the study pictures…" : "Choose the study pictures…"}
        </button>
        <input ref={picker} type="file" accept="image/*" multiple className="hidden" onChange={(e) => void choose(e.target.files)} />
        {images.length > 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void apply([])}
            className="text-[12px] font-semibold text-red-700 hover:underline disabled:opacity-50"
          >
            Remove all
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-[12px] font-semibold text-red-700">✕ {error}</p>}
    </div>
  );
}
