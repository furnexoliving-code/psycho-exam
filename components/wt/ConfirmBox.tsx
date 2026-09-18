"use client";

/** The portal's small centred confirmation. Always mouse-operable. */
export function ConfirmBox({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-md rounded bg-white shadow-xl" data-allow-mouse="true">
        <p className="px-5 pb-2 pt-5 text-center text-[15px] font-semibold text-gray-900">
          {title}
        </p>
        {body && (
          <p className="px-5 pb-3 text-center text-[13px] text-gray-700">{body}</p>
        )}
        <div className="flex justify-center gap-3 px-5 pb-5 pt-2">
          <button
            type="button"
            onClick={onConfirm}
            className="min-w-[120px] rounded bg-wt-submit px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="min-w-[120px] rounded bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
