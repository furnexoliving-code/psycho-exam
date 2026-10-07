"use client";

import { useState } from "react";
import { SaveForm } from "@/components/admin/SaveForm";
import { RowForm } from "@/components/admin/RowForm";
import { PendingButton } from "@/components/admin/PendingButton";
import { removeMyPhoto, updateMyPhoto } from "@/app/dashboard/actions";

/**
 * The student's photo, as the exam header will show it. Upload or replace
 * it here; the rest of the account (name, mobile, roll number) is read-only
 * for the student, as the institute set it.
 */
export function PhotoCard({ photoUrl, name, rollNo, phone }: { photoUrl: string | null; name: string; rollNo: string; phone: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const shown = preview ?? photoUrl;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-[15px] font-bold text-gray-900">
        Photo <span className="font-normal text-gray-500" lang="hi">/ फ़ोटो</span>
      </h2>
      <div className="mt-3 flex items-start gap-4">
        <div className="flex h-[96px] w-[84px] shrink-0 items-center justify-center overflow-hidden border border-[#bbbbbb] bg-[#dfe6ee]">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" className="h-full w-full object-cover" />
          ) : (
            <svg viewBox="0 0 48 48" className="h-[64px] w-[64px]" aria-hidden="true">
              <circle cx="24" cy="17" r="10" fill="#8fa3b8" />
              <path d="M6 46c2-12 10-16 18-16s16 4 18 16z" fill="#8fa3b8" />
            </svg>
          )}
        </div>
        <dl className="min-w-0 flex-1 text-[13px]">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Name</dt>
          <dd className="truncate font-semibold text-gray-900">{name}</dd>
          {rollNo && (
            <>
              <dt className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Roll No</dt>
              <dd className="text-gray-900">{rollNo}</dd>
            </>
          )}
          {phone && (
            <>
              <dt className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Mobile</dt>
              <dd className="text-gray-900">{phone}</dd>
            </>
          )}
        </dl>
      </div>
      <p className="mt-3 text-[12px] text-gray-500">
        Your photo appears in the exam header, as in the hall. A passport-style photo looks best.
        <span className="block" lang="hi">आपकी फ़ोटो परीक्षा हेडर में दिखेगी, परीक्षा हॉल की तरह। पासपोर्ट जैसी फ़ोटो सबसे अच्छी लगती है।</span>
      </p>
      <SaveForm action={updateMyPhoto} submitLabel={photoUrl ? "Replace photo" : "Upload photo"} className="mt-3" buttonClassName="rounded-lg bg-indigo-800 px-4 py-2 text-[13px] font-semibold text-white hover:bg-indigo-900 disabled:opacity-60">
        <input
          type="file"
          name="photo"
          accept="image/jpeg,image/png,image/webp"
          required
          onChange={(e) => {
            const f = e.target.files?.[0];
            setPreview(f ? URL.createObjectURL(f) : null);
          }}
          className="block w-full text-[12px] text-gray-700 file:mr-3 file:rounded file:border file:border-gray-400 file:bg-white file:px-3 file:py-1.5 file:text-[12px] file:font-semibold"
        />
        <span className="mt-1 block text-[11px] text-gray-500">JPG, PNG or WEBP, under 2 MB. A passport-style photo looks best.</span>
      </SaveForm>
      {photoUrl && (
        <RowForm action={removeMyPhoto} className="mt-2">
          <PendingButton pendingLabel="Removing…" confirm="Remove your photo?" className="text-[12px] font-semibold text-red-700 hover:underline">
            Remove photo
          </PendingButton>
        </RowForm>
      )}
    </section>
  );
}
