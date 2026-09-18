"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Shared sign-in / sign-up form. */
export function AuthForm({ mode, next }: { mode: "login" | "signup"; next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    const supabase = createClient();

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        // Picked up by the handle_new_user trigger to populate the profile.
        options: { data: { full_name: fullName, roll_no: rollNo, phone } },
      });

      if (signUpError) {
        setError(signUpError.message);
        setBusy(false);
        return;
      }

      // With email confirmation on, there is no session until the link is clicked.
      if (!data.session) {
        setNotice("Account created. Check your email to confirm, then sign in.");
        setBusy(false);
        return;
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setBusy(false);
        return;
      }
    }

    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3 rounded border border-gray-300 bg-white p-5">
      {mode === "signup" && (
        <>
          <Field label="Full name" value={fullName} onChange={setFullName} required />
          <Field label="Roll number" value={rollNo} onChange={setRollNo} />
          <Field label="Mobile" value={phone} onChange={setPhone} type="tel" />
        </>
      )}

      <Field label="Email" value={email} onChange={setEmail} type="email" required />
      <Field
        label="Password"
        value={password}
        onChange={setPassword}
        type="password"
        required
        hint={mode === "signup" ? "At least 6 characters" : undefined}
      />

      {error && (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-[13px] text-red-800">
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded border border-green-300 bg-green-50 px-3 py-2 text-[13px] text-green-800">
          {notice}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded bg-indigo-800 px-4 py-2.5 text-sm font-semibold text-white
                   hover:bg-indigo-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-gray-400 px-3 py-2 text-[14px]
                   focus:border-rrb-banner focus:outline-none focus:ring-1 focus:ring-rrb-banner"
      />
      {hint && <span className="mt-1 block text-[11px] text-gray-500">{hint}</span>}
    </label>
  );
}
