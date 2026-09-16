"use client";

import type { ReactNode } from "react";

/** The portal's small centred modal, used for skip and submit confirmations. */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Yes",
  cancelLabel = "No",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-md rounded bg-white shadow-xl">
        <div className="px-5 pb-3 pt-5 text-center text-[15px] font-semibold text-gray-900">
          {title}
        </div>
        {body && <div className="px-5 pb-3 text-[13px] text-gray-700">{body}</div>}
        <div className="flex justify-center gap-3 px-5 pb-5 pt-2">
          <button
            type="button"
            onClick={onConfirm}
            className="min-w-[110px] rounded bg-indigo-800 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-900"
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="min-w-[110px] rounded bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
