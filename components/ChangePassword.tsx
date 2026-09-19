"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { phoneToEmail } from "@/lib/phone";

/**
 * Lets a student set their own password.
 *
 * The current password is checked first — by signing in with it — so a
 * student who walks away from a shared PC without signing out does not hand
 * the next person the right to lock them out of their own account.
 */
export function ChangePassword({ phone }: { phone: string }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (next.length < 6) return setMessage({ ok: false, text: "The new password must be at least 6 characters." });
    if (next !== again) return setMessage({ ok: false, text: "The two new passwords do not match." });
    if (next === current) return setMessage({ ok: false, text: "The new password is the same as the current one." });

    setBusy(true);
    const supabase = createClient();
    const { error: checkError } = await supabase.auth.signInWithPassword({
      email: phoneToEmail(phone),
      password: current,
    });
    if (checkError) {
      setMessage({ ok: false, text: "The current password is not right." });
      setBusy(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: next });
    setBusy(false);
    if (error) {
      setMessage({ ok: false, text: error.message });
      return;
    }
    setCurrent("");
    setNext("");
    setAgain("");
    setMessage({ ok: true, text: "Password changed. Use the new one from your next sign-in." });
  };

  const field =
    "w-full rounded border border-gray-400 px-3 py-2 text-[14px] focus:border-rrb-banner focus:outline-none focus:ring-1 focus:ring-rrb-banner";

  return (
    <section className="mt-9 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold text-gray-900">Your password</h2>
          <p className="text-[12px] text-gray-500">Change the password you sign in with.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg border border-gray-400 bg-white px-4 py-2 text-[13px] font-semibold text-gray-800 hover:bg-gray-100"
        >
          {open ? "Close" : "Change password"}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Current password</span>
            <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required className={field} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">New password</span>
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={6} required className={field} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">New password again</span>
            <input type="password" value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" minLength={6} required className={field} />
          </label>

          <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-indigo-800 px-5 py-2 text-[13px] font-semibold text-white hover:bg-indigo-900 disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save new password"}
            </button>
            {message && (
              <p role={message.ok ? "status" : "alert"} className={`text-[13px] font-semibold ${message.ok ? "text-green-700" : "text-red-700"}`}>
                {message.ok ? "✓ " : "✕ "}
                {message.text}
              </p>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
