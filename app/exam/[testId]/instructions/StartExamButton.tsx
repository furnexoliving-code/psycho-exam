"use client";

import { useRouter } from "next/navigation";
import { clearSaved } from "@/lib/exam-store";

/**
 * Starting from the instructions page always begins a fresh attempt, so any
 * half-finished run left in local storage is discarded first.
 */
export function StartExamButton({ testId }: { testId: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        clearSaved(testId);
        router.push(`/exam/${testId}`);
      }}
      className="rounded bg-indigo-800 px-8 py-2.5 text-sm font-semibold text-white hover:bg-indigo-900"
    >
      Start Test
    </button>
  );
}
