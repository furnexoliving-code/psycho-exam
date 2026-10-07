"use client";

import { useActionState, useState } from "react";
import type { SaveState } from "@/lib/admin-result";
import { reportQuestion } from "@/app/test/[paperId]/result/actions";

/** The small "Report a problem" control under a reviewed question. */
export function ReportQuestion({ paperSlug, questionId }: { paperSlug: string; questionId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<SaveState | null, FormData>(reportQuestion, null);

  if (state?.ok) {
    return <p className="mt-3 text-[12px] font-semibold text-green-700">✓ {state.message.replace(/^Report — /, "")}</p>;
  }
  return (
    <div className="mt-3 no-capture">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="text-[12px] font-semibold text-gray-500 hover:text-red-700 hover:underline">
          ⚑ Report a problem with this question <span lang="hi">/ इस प्रश्न में गलती है</span>
        </button>
      ) : (
        <form action={formAction} className="flex flex-wrap items-start gap-2">
          <input type="hidden" name="paper" value={paperSlug} />
          <input type="hidden" name="question" value={questionId} />
          <input
            name="note"
            maxLength={300}
            placeholder="What is wrong? (optional) / क्या गलत है?"
            className="w-full max-w-md rounded border border-gray-400 px-3 py-1.5 text-[13px]"
          />
          <button type="submit" disabled={pending} className="rounded bg-red-700 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-red-800 disabled:opacity-60">
            {pending ? "Sending…" : "Send report"}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="rounded border border-gray-400 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-700">
            Cancel
          </button>
          {state && !state.ok && <p role="alert" className="w-full text-[12px] font-semibold text-red-700">{state.message}</p>}
        </form>
      )}
    </div>
  );
}
