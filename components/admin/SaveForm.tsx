"use client";

import { useActionState } from "react";
import type { SaveState } from "@/lib/admin-result";

type Action = (prev: SaveState | null, formData: FormData) => Promise<SaveState>;

/**
 * A form that saves where it stands.
 *
 * The outcome comes back into the page instead of through a redirect, so the
 * admin keeps their scroll position and the field they were looking at. The
 * button reports its own progress, because a save with no navigation and no
 * feedback looks exactly like a save that did nothing.
 */
export function SaveForm({
  action,
  submitLabel,
  children,
  className,
  buttonClassName = "rounded bg-indigo-800 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-900 disabled:opacity-60",
  footer,
}: {
  action: Action;
  submitLabel: string;
  children: React.ReactNode;
  className?: string;
  buttonClassName?: string;
  /** Extra controls to sit beside the button. */
  footer?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className={className}>
      {children}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={buttonClassName}>
          {pending ? "Saving…" : submitLabel}
        </button>
        {footer}

        {state && (
          <span
            role={state.ok ? undefined : "alert"}
            className={`text-[13px] font-semibold ${
              state.ok ? "text-green-700" : "text-red-700"
            }`}
          >
            {state.ok ? `✓ ${state.message}` : `✕ Not saved — ${state.message}`}
          </span>
        )}
      </div>
    </form>
  );
}
