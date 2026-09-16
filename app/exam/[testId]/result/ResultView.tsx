"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatClock, scoreExam, type ExamResult } from "@/lib/scoring";
import type { ExamState, Test } from "@/lib/types";

/**
 * The result is recomputed in the browser from the saved run, because the exam
 * itself never leaves local storage in this build.
 */
export function ResultView({ test }: { test: Test }) {
  const [result, setResult] = useState<ExamResult | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(`alp-psycho:${test.id}`);
      if (!raw) {
        setMissing(true);
        return;
      }
      setResult(scoreExam(test, JSON.parse(raw) as ExamState));
    } catch {
      setMissing(true);
    }
  }, [test]);

  if (missing) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 text-center">
        <h1 className="text-xl font-bold text-gray-900">No attempt found</h1>
        <p className="mt-2 text-[14px] text-gray-600">
          We could not find a saved attempt for this test in this browser.
        </p>
        <Link
          href={`/exam/${test.id}/instructions`}
          className="mt-6 inline-block rounded bg-indigo-800 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-900"
        >
          Take the test
        </Link>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="flex-1 px-5 py-10 text-center text-[14px] text-gray-500">
        Calculating your result…
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Result Summary</h1>
      <p className="mt-1 text-[13px] text-gray-600">{test.displayName}</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-4">
        <Stat label="Score" value={`${result.totalCorrect} / ${result.scoredQuestions}`} />
        <Stat label="Attempted" value={`${result.totalAttempted} / ${result.totalQuestions}`} />
        <Stat label="Incorrect" value={String(result.totalWrong)} />
        <Stat label="Accuracy" value={`${result.overallAccuracy.toFixed(1)}%`} />
      </div>

      <p className="mt-3 text-[12px] text-gray-500">
        The Personality Test has no answer key and is excluded from the score; it
        is reported for completion only.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-rrb-banner text-left text-white">
              <th className="border border-gray-300 px-3 py-2">Test</th>
              <th className="border border-gray-300 px-3 py-2">Total</th>
              <th className="border border-gray-300 px-3 py-2">Attempted</th>
              <th className="border border-gray-300 px-3 py-2">Correct</th>
              <th className="border border-gray-300 px-3 py-2">Wrong</th>
              <th className="border border-gray-300 px-3 py-2">Accuracy</th>
              <th className="border border-gray-300 px-3 py-2">Time taken</th>
            </tr>
          </thead>
          <tbody>
            {result.sections.map((section) => (
              <tr key={section.sectionId} className="odd:bg-white even:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2 font-semibold text-gray-900">
                  {section.name}
                  {!section.scored && (
                    <span className="ml-2 rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium uppercase text-gray-600">
                      not scored
                    </span>
                  )}
                </td>
                <td className="border border-gray-300 px-3 py-2">{section.total}</td>
                <td className="border border-gray-300 px-3 py-2">{section.attempted}</td>
                <td className="border border-gray-300 px-3 py-2">
                  {section.scored ? section.correct : "—"}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {section.scored ? section.wrong : "—"}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {section.scored ? `${section.accuracy.toFixed(1)}%` : "—"}
                </td>
                <td className="border border-gray-300 px-3 py-2 font-mono tabular-nums">
                  {formatClock(section.timeTakenSec)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex gap-3">
        <Link
          href={`/exam/${test.id}/instructions`}
          className="rounded bg-indigo-800 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-900"
        >
          Re-attempt test
        </Link>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-gray-300 bg-gray-50 px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
