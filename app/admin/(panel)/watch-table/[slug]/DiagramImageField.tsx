"use client";

import { useState } from "react";
import { ImageUpload } from "@/components/admin/ImageUpload";

/**
 * The picture shown beside the questions during the test.
 *
 * This is the main path: an institute draws its own diagram and uploads it,
 * then writes questions whose answers it supplies. The eight positions below
 * are only for the portal's own drawing and its sample questions — they take
 * no part in marking, which compares against the answer stored with each
 * uploaded question.
 */
export function DiagramImageField({
  defaultUrl,
  children,
}: {
  defaultUrl: string;
  /** The width control, rendered by the server component. */
  children?: React.ReactNode;
}) {
  const [url, setUrl] = useState(defaultUrl);

  return (
    <div>
      <div>
        <ImageUpload label="Upload the question image…" hint="Fills the box below for you." onUploaded={setUrl} />
      </div>

      <label className="mt-3 block">
        <span className="mb-1 block text-[12px] font-semibold text-gray-700">
          Image link
        </span>
        <input
          name="image_url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…/question-image.png"
          className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]"
        />
      </label>

      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="Question image preview"
          className="mt-3 h-auto w-full max-w-[320px] rounded border border-gray-300"
        />
      ) : (
        <p className="mt-3 rounded border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-[12px] text-gray-500">
          No image set. The portal will draw the diagram from the eight
          positions below instead.
        </p>
      )}

      {children}
    </div>
  );
}
