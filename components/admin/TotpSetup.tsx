"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { describeMfaError } from "./mfa-errors";

interface Enrolment {
  id: string;
  /** A data URL of the QR code, ready for an <img>. */
  qr: string;
  secret: string;
}

/**
 * Enrols an authenticator app as the admin's second factor.
 *
 * The app is shown a QR code (or the secret, typed by hand); the code it then
 * produces proves the enrolment worked. Nothing counts until that first code
 * is accepted, so an abandoned attempt leaves the account exactly as it was.
 */
export function TotpSetup() {
  const router = useRouter();
  const [enrolment, setEnrolment] = useState<Enrolment | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // One enrolment per page, whatever React does with the effect: in
  // development it runs effects twice, and two enrolments by the same name
  // collide at the auth server.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let cancelled = false;
    (async () => {
      const supabase = createClient();

      // An earlier attempt that never reached its first code leaves an
      // unverified factor behind, and the auth server refuses a second one
      // by the same name. Clear it and start clean.
      const { data: existing } = await supabase.auth.mfa.listFactors();
      for (const factor of existing?.all ?? []) {
        if (factor.status === "unverified") {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
      }

      const { data, error: enrolError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator app",
      });
      if (cancelled) return;
      if (enrolError || !data) {
        setError(
          enrolError ? describeMfaError(enrolError) : "The authenticator could not be set up.",
        );
        return;
      }
      setEnrolment({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrolment) return;
    setError(null);
    const digits = code.replace(/\s+/g, "");
    if (!/^\d{6}$/.test(digits)) {
      setError("Enter the six digits the app shows.");
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enrolment.id,
      code: digits,
    });
    if (verifyError) {
      setError(describeMfaError(verifyError));
      setBusy(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  };

  if (error && !enrolment) {
    return (
      <p role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-[13px] text-red-700">
        {error}
      </p>
    );
  }

  if (!enrolment) {
    return <p className="text-center text-[13px] text-gray-500">Preparing your code…</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <ol className="list-decimal space-y-1 pl-5 text-[13px] text-gray-700">
        <li>
          Install an authenticator app on your phone — Google Authenticator, Microsoft
          Authenticator or Authy.
        </li>
        <li>In the app, add an account by scanning this code:</li>
      </ol>

      <div className="flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={enrolment.qr} alt="QR code for the authenticator app" className="h-48 w-48" />
      </div>

      <details className="text-[12px] text-gray-600">
        <summary className="cursor-pointer font-semibold">Cannot scan? Type the key instead</summary>
        <code className="mt-1 block break-all rounded bg-gray-100 px-2 py-1 font-mono text-[12px] text-gray-800">
          {enrolment.secret}
        </code>
      </details>

      <label className="block">
        <span className="mb-1 block text-[13px] font-semibold text-gray-800">
          3. Enter the six-digit code the app now shows
        </span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
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
        {busy ? "Checking…" : "Turn on two-factor sign-in"}
      </button>
    </form>
  );
}
