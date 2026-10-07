"use client";

import { SaveForm } from "@/components/admin/SaveForm";
import { updateMyName } from "@/app/dashboard/actions";

/** The student's own name, as the results and the exam header show it. */
export function NameForm({ name }: { name: string }) {
  return (
    <SaveForm action={updateMyName} submitLabel="Save name" buttonClassName="rounded-lg bg-indigo-800 px-4 py-2 text-[13px] font-semibold text-white hover:bg-indigo-900 disabled:opacity-60">
      <label className="block">
        <span className="mb-1 block text-[12px] font-semibold text-gray-700">Full name, as on your admit card</span>
        <input
          name="full_name"
          defaultValue={name}
          required
          minLength={2}
          maxLength={60}
          className="w-full max-w-md rounded border border-gray-400 px-3 py-2 text-[14px] focus:border-rrb-banner focus:outline-none focus:ring-1 focus:ring-rrb-banner"
        />
      </label>
      <p className="mt-1 text-[11px] text-gray-500">Letters, spaces and dots only. Shown on your results and in the exam header.</p>
    </SaveForm>
  );
}
