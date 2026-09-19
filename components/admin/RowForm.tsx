"use client";

import { useActionState } from "react";
import type { SaveState } from "@/lib/admin-result";

type Action = (prev: SaveState | null, formData: FormData) => Promise<SaveState>;

/**
 * A one-line form inside a table row.
 *
 * Same idea as SaveForm, but the row supplies its own small button, and the
 * outcome appears under it rather than beside it — a table cell has no width
 * to spare for a sentence.
 */
export function RowForm({
  action,
  children,
  className,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className={className} data-pending={pending || undefined}>
      {children}
      {state && (
        <span
          role={state.ok ? undefined : "alert"}
          className={`mt-1 block text-[10px] font-semibold ${
            state.ok ? "text-green-700" : "text-red-700"
          }`}
        >
          {state.ok ? "✓ done" : `✕ ${state.message}`}
        </span>
      )}
    </form>
  );
}
