/**
 * The outcome of an action that had to navigate — a copy, a delete, a
 * creation — shown on the page it landed on. Without this the message lived
 * only in the address bar, and the button looked as if it had done nothing.
 */
export function AdminNotice({ error, saved }: { error?: string; saved?: string }) {
  if (!error && !saved) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={`mt-3 rounded border px-4 py-2.5 text-[13px] font-semibold ${
        error
          ? "border-red-300 bg-red-50 text-red-800"
          : "border-green-300 bg-green-50 text-green-800"
      }`}
    >
      {error ? `✕ ${error}` : `✓ ${saved}`}
    </p>
  );
}
