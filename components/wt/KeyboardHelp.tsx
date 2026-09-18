"use client";

import { KEY_HELP } from "@/lib/wt/useKeyboardOnly";

/**
 * The keys are no longer printed on the exam screen — the reference portal
 * shows no such strip. They remain here, behind H, for anyone who looks.
 */

export function KeyboardHelpPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard controls"
    >
      <div className="w-full max-w-lg rounded bg-white shadow-xl" data-allow-mouse="true">
        <div className="border-b border-gray-200 px-5 py-3">
          <h2 className="text-[16px] font-bold text-gray-900">Keyboard controls</h2>
          <p className="text-[12px] text-gray-600">
            The mouse works normally — you can click an option. Only scrolling is
            switched off, so use the keys below to move through the paper.
          </p>
        </div>

        <table className="w-full text-[13px]">
          <tbody className="divide-y divide-gray-100">
            {KEY_HELP.map((row) => (
              <tr key={row.keys}>
                <td className="w-[38%] px-5 py-2">
                  <kbd className="rounded border border-gray-400 bg-gray-50 px-2 py-0.5 font-semibold text-gray-800">
                    {row.keys}
                  </kbd>
                </td>
                <td className="px-5 py-2 text-gray-800">
                  {row.action}
                  <span className="ml-2 text-gray-500" lang="hi">
                    {row.actionHi}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end border-t border-gray-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-wt-submit px-6 py-2 text-[13px] font-semibold text-white hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
