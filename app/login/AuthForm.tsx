"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isValidPhone, phoneToEmail } from "@/lib/phone";

/**
 * Sign in with the mobile number and password the institute issued.
 *
 * There is no sign-up: accounts are created in the admin panel. A student who
 * cannot sign in has to be given an account, not told to make one, so the
 * screen says that rather than offering a link that would not work.
 */
export function AuthForm({ next }: { next: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidPhone(phone)) {
      setError("Enter the 10-digit mobile number your institute gave you.");
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: phoneToEmail(phone),
      password,
    });

    if (signInError) {
      // Never say which half was wrong: that would confirm to a stranger which
      // mobile numbers have accounts.
      setError("That mobile number and password do not match. Please try again.");
      setBusy(false);
      return;
    }

    router.push(next);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-[13px] font-semibold text-gray-800">
          Mobile number <span className="text-red-600">*</span>
        </span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          type="tel"
          inputMode="numeric"
          autoComplete="username"
          autoFocus
          maxLength={15}
          placeholder="10-digit mobile number"
          required
          className="w-full rounded border border-gray-400 bg-blue-50 px-3 py-2.5 text-[15px]
                     focus:border-rrb-banner focus:outline-none focus:ring-1 focus:ring-rrb-banner"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-[13px] font-semibold text-gray-800">
          Password <span className="text-red-600">*</span>
        </span>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded border border-gray-400 bg-blue-50 px-3 py-2.5 text-[15px]
                     focus:border-rrb-banner focus:outline-none focus:ring-1 focus:ring-rrb-banner"
        />
      </label>

      {error && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded bg-indigo-800 px-4 py-2.5 text-[15px] font-semibold text-white
                   hover:bg-indigo-900 disabled:opacity-60"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
