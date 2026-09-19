"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { describeMfaError } from "./mfa-errors";

/** The six-digit code from the admin's authenticator, checked against it. */
export function TotpVerify({ next }: { next: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const digits = code.replace(/\s+/g, "");
    if (!/^\d{6}$/.test(digits)) {
      setError("Enter the six digits shown in the app.");
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
    if (listError) {
      setError(`Could not reach the sign-in service: ${listError.message}. Try again.`);
      setBusy(false);
      return;
    }
    const factor = factors?.totp?.[0];
    if (!factor) {
      router.replace("/admin/setup-2fa");
      router.refresh();
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code: digits,
    });
    if (verifyError) {
      setError(describeMfaError(verifyError));
      setBusy(false);
      return;
    }

    // The session is now at the higher level; the server re-reads it.
    router.replace(next);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-[13px] font-semibold text-gray-800">
          Six-digit code
        </span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={7}
          placeholder="123 456"
          required
          className="w-full rounded border border-gray-400 bg-blue-50 px-3 py-2.5 text-center text-[22px] tracking-[0.3em]
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
        {busy ? "Checking…" : "Open the panel"}
      </button>
    </form>
  );
}
