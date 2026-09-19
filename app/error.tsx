"use client";

import Link from "next/link";

/**
 * The page when something on the server fails. It says so plainly and offers
 * a way back; it never shows the error itself, which may name tables or keys.
 */
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-5 py-16 text-center">
      <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
      <p className="mt-2 text-[14px] text-gray-600">
        The page could not be loaded. Try again, and if it keeps happening tell the
        institute.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded bg-indigo-800 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-900"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded border border-gray-400 bg-white px-5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
