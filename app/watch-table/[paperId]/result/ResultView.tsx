"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PortalBanner } from "@/components/wt/PortalBanner";
import { WatchTableDiagram } from "@/components/wt/WatchTableDiagram";
import { scoreAttempt, type AttemptState } from "@/lib/wt/state";
import type { WatchPaper } from "@/lib/wt/types";

/**
 * Result and review. The attempt is scored in the browser from the saved run,
 * then every question is shown with the candidate's choice, the right answer
 * and the derivation — which is the part that actually teaches.
 */
export function ResultView({ paper }: { paper: WatchPaper }) {
  const [answers, setAnswers] = useState<Record<string, number | null> | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(`wt-attempt:${paper.id}`);
      if (!raw) {
        setMissing(true);
        return;
      }
      setAnswers((JSON.parse(raw) as AttemptState).answers);
    } catch {
      setMissing(true);
    }
  }, [paper.id]);

  if (missing) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <PortalBanner />
        <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-12 text-center">
          <h1 className="text-xl font-bold text-gray-900">No attempt found</h1>
          <p className="mt-2 text-[14px] text-gray-600">
            Nothing is saved for this paper in this browser.
          </p>
          <Link
            href={`/watch-table/${paper.id}`}
            className="mt-6 inline-block rounded bg-wt-submit px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Take the test
          </Link>
        </main>
      </div>
    );
  }

  if (!answers) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <PortalBanner />
        <main className="flex-1 px-5 py-12 text-center text-[14px] text-gray-500">
          Calculating your result…
        </main>
      </div>
    );
  }

  const score = scoreAttempt(paper, answers);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <PortalBanner />

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-7">
        <h1 className="text-2xl font-bold text-gray-900">Result</h1>
        <p className="mt-1 text-[13px] text-gray-600">{paper.displayName}</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-4">
          <Stat label="Score" value={`${score.correct} / ${score.total}`} />
          <Stat label="Attempted" value={`${score.attempted} / ${score.total}`} />
          <Stat label="Incorrect" value={String(score.wrong)} />
          <Stat label="Accuracy" value={`${score.accuracy.toFixed(1)}%`} />
        </div>

        <h2 className="mt-8 text-[16px] font-bold text-gray-900">Review</h2>
        <ol className="mt-3 space-y-4">
          {paper.questions.map((q, i) => {
            const given = answers[q.id];
            const right = given === q.answer;
            const table = paper.tables[q.tableIndex];

            return (
              <li
                key={q.id}
                className={`rounded border bg-white p-4 ${
                  given === null || given === undefined
                    ? "border-gray-300"
                    : right
                      ? "border-green-400"
                      : "border-red-400"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row">
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold text-gray-500">Q. {i + 1}</p>
                    <p className="mt-1 text-[15px] text-gray-900">{q.prompt.en}</p>
                    <p className="text-[15px] text-gray-900" lang="hi">
                      {q.prompt.hi}
                    </p>

                    <p className="mt-2 text-[13px]">
                      <span className="text-gray-600">Your answer: </span>
                      <strong
                        className={
                          given === null || given === undefined
                            ? "text-gray-500"
                            : right
                              ? "text-green-700"
                              : "text-red-700"
                        }
                      >
                        {given ?? "not attempted"}
                      </strong>
                      <span className="ml-4 text-gray-600">Correct: </span>
                      <strong className="text-green-700">{q.answer}</strong>
                    </p>

                    <p className="mt-2 rounded bg-gray-50 px-3 py-2 text-[12px] text-gray-700">
                      {q.working.en}
                    </p>
                  </div>

                  <div className="shrink-0 lg:w-[230px]">
                    {table && <WatchTableDiagram table={table} />}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-8 flex gap-3">
          <Link
            href={`/watch-table/${paper.id}`}
            className="rounded bg-wt-submit px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Re-attempt
          </Link>
          <Link
            href="/"
            className="rounded border border-gray-400 bg-white px-6 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100"
          >
            Home
          </Link>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-gray-300 bg-white px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
