"use client";

import { useFormStatus } from "react-dom";

/**
 * A submit button that knows its form is busy. Inside a form that navigates
 * on completion there is otherwise no sign anything happened, and a second
 * click sends the action twice — two copies of a paper, two deletes.
 */
export function PendingButton({
  children,
  pendingLabel = "Working…",
  confirm: confirmText,
  className,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  /** When set, the browser asks this before the form is sent. */
  confirm?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      onClick={(event) => {
        if (confirmText && !window.confirm(confirmText)) event.preventDefault();
      }}
      className={className}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
