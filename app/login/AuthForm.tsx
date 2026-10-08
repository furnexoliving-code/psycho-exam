"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, type SignInResult } from "./actions";

/**
 * Sign in with the mobile number and password the institute issued.
 *
 * There is no sign-up: accounts are created in the admin panel. A student who
 * cannot sign in has to be given an account, not told to make one, so the
 * screen says that rather than offering a link that would not work. The
 * check happens on the server, which counts wrong passwords and stamps the
 * device.
 */
export function AuthForm({ next }: { next: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<SignInResult | null, FormData>(signIn, null);

  useEffect(() => {
    if (state?.ok) {
      router.push(next);
      router.refresh();
    }
  }, [state, next, router]);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-[13px] font-semibold text-gray-800">
          Mobile number <span className="text-red-600">*</span>
        </span>
        <input
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="username"
          autoFocus
          maxLength={15}
          placeholder="10-digit mobile number"
          required
          className="w-full rounded border border-gray-400 bg-white px-3 py-2.5 text-[15px]
                     focus:border-rrb-banner focus:outline-none focus:ring-1 focus:ring-rrb-banner"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-[13px] font-semibold text-gray-800">
          Password <span className="text-red-600">*</span>
        </span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded border border-gray-400 bg-white px-3 py-2.5 text-[15px]
                     focus:border-rrb-banner focus:outline-none focus:ring-1 focus:ring-rrb-banner"
        />
      </label>

      {state && !state.ok && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || state?.ok === true}
        className="w-full rounded-md bg-[#0d2a6b] px-4 py-3 text-[15px] font-bold text-white
                   hover:bg-[#0a2158] disabled:opacity-60"
      >
        {pending || state?.ok ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
