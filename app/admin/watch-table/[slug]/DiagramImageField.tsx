"use client";

import { useState } from "react";
import { ImageUpload } from "@/components/admin/ImageUpload";

/** The exam's own diagram picture: upload it, or paste a link you already have. */
export function DiagramImageField({ defaultUrl }: { defaultUrl: string }) {
  const [url, setUrl] = useState(defaultUrl);

  return (
    <div className="mt-4">
      <label className="block">
        <span className="mb-1 block text-[12px] font-semibold text-gray-700">
          Or show your own image instead
        </span>
        <input
          name="image_url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…/watch-table.png"
          className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]"
        />
      </label>

      <div className="mt-2">
        <ImageUpload onUploaded={setUrl} hint="Fills the box above for you." />
      </div>

      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="Diagram preview"
          className="mt-3 h-auto w-full max-w-[280px] rounded border border-gray-300"
        />
      )}

      <p className="mt-2 text-[11px] text-gray-500">
        When set, the exam shows this picture in place of the drawing. Keep the
        eight positions above filled in anyway — they are what the answers are
        checked against.
      </p>
    </div>
  );
}
