"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signUp, type SignUpResult } from "./actions";

const field =
  "w-full rounded border border-gray-400 bg-white px-3 py-2.5 text-[15px] focus:border-rrb-banner focus:outline-none focus:ring-1 focus:ring-rrb-banner";

export function SignUpForm({ next }: { next: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<SignUpResult | null, FormData>(signUp, null);

  useEffect(() => {
    if (state?.ok) {
      router.push(next);
      router.refresh();
    }
  }, [state, next, router]);

  return (
    <form action={formAction} className="space-y-4">
      {/* Never shown; a script that fills every field is refused. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <label className="block">
        <span className="mb-1 block text-[13px] font-semibold text-gray-800">
          Full name <span className="text-red-600">*</span>
        </span>
        <input name="full_name" type="text" autoComplete="name" autoFocus required maxLength={60} placeholder="As on your ID" className={field} />
      </label>

      <label className="block">
        <span className="mb-1 block text-[13px] font-semibold text-gray-800">
          Mobile number <span className="text-red-600">*</span>
        </span>
        <input name="phone" type="tel" inputMode="numeric" autoComplete="tel" required maxLength={15} placeholder="10-digit mobile number" className={field} />
        <span className="mt-1 block text-[11px] text-gray-500">This becomes your login ID. यही आपकी लॉगिन ID होगी।</span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[13px] font-semibold text-gray-800">
            Password <span className="text-red-600">*</span>
          </span>
          <input name="password" type="password" autoComplete="new-password" required minLength={6} className={field} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[13px] font-semibold text-gray-800">
            Confirm password <span className="text-red-600">*</span>
          </span>
          <input name="confirm" type="password" autoComplete="new-password" required minLength={6} className={field} />
        </label>
      </div>

      {state && !state.ok && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || state?.ok === true}
        className="w-full rounded-md bg-[#0d2a6b] px-4 py-3 text-[15px] font-bold text-white hover:bg-[#0a2158] disabled:opacity-60"
      >
        {pending || state?.ok ? "Creating your account…" : "Create account · free"}
      </button>
      <p className="text-center text-[11px] text-gray-500">
        By creating an account you agree to the <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy Policy</a>.
      </p>
    </form>
  );
}
