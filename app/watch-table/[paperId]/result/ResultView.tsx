"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PortalBanner } from "@/components/wt/PortalBanner";
import type { MarkedQuestion } from "@/app/api/watch-table/score/route";
import type { AttemptState } from "@/lib/wt/state";

interface Score {
  total: number;
  attempted: number;
  correct: number;
  wrong: number;
  accuracy: number;
}

/**
 * Result and review.
 *
 * The page is handed no answer key. It posts what the candidate chose to the
 * scoring route and renders what comes back, so opening this page before
 * submitting reveals nothing.
 */
export function ResultView({
  paperId,
  displayName,
}: {
  paperId: string;
  displayName: string;
}) {
  const [marked, setMarked] = useState<MarkedQuestion[] | null>(null);
  const [score, setScore] = useState<Score | null>(null);
  const [state, setState] = useState<"loading" | "missing" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let answers: Record<string, number | null> = {};
      try {
        const raw = window.localStorage.getItem(`wt-attempt:${paperId}`);
        if (!raw) {
          setState("missing");
          return;
        }
        answers = (JSON.parse(raw) as AttemptState).answers ?? {};
      } catch {
        setState("missing");
        return;
      }

      try {
        const response = await fetch("/api/watch-table/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paperId, answers }),
        });
        if (!response.ok) throw new Error(String(response.status));

        const data = (await response.json()) as {
          questions: MarkedQuestion[];
          score: Score;
        };
        if (cancelled) return;
        setMarked(data.questions);
        setScore(data.score);
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [paperId]);

  if (state === "missing" || state === "error") {
    return (
      <Shell>
        <h1 className="text-xl font-bold text-gray-900">
          {state === "missing" ? "No attempt found" : "Could not load your result"}
        </h1>
        <p className="mt-2 text-[14px] text-gray-600">
          {state === "missing"
            ? "Nothing is saved for this paper in this browser."
            : "Something went wrong while marking the paper. Try again."}
        </p>
        <Link
          href={`/watch-table/${paperId}`}
          className="mt-6 inline-block rounded bg-wt-submit px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Back to the test
        </Link>
      </Shell>
    );
  }

  if (state === "loading" || !marked || !score) {
    return (
      <Shell>
        <p className="py-8 text-center text-[14px] text-gray-500">Marking your paper…</p>
      </Shell>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <PortalBanner showInstructions={false} showQuestionPaper={false} />

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-7">
        <h1 className="text-2xl font-bold text-gray-900">Result</h1>
        <p className="mt-1 text-[13px] text-gray-600">{displayName}</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-4">
          <Stat label="Score" value={`${score.correct} / ${score.total}`} />
          <Stat label="Attempted" value={`${score.attempted} / ${score.total}`} />
          <Stat label="Incorrect" value={String(score.wrong)} />
          <Stat label="Accuracy" value={`${score.accuracy.toFixed(1)}%`} />
        </div>

        <h2 className="mt-8 text-[16px] font-bold text-gray-900">Review</h2>
        <ol className="mt-3 space-y-3">
          {marked.map((q, i) => (
            <li
              key={q.id}
              className={`rounded border bg-white p-4 ${
                q.given === null
                  ? "border-gray-300"
                  : q.isCorrect
                    ? "border-green-400"
                    : "border-red-400"
              }`}
            >
              <p className="text-[12px] font-bold text-gray-500">Q. {i + 1}</p>
              <p className="mt-1 text-[15px] text-[#494949]">{q.promptEn}</p>
              {q.promptHi && (
                <p className="text-[15px] text-[#494949]" lang="hi">
                  {q.promptHi}
                </p>
              )}

              <p className="mt-2 text-[13px]">
                <span className="text-gray-600">Your answer: </span>
                <strong
                  className={
                    q.given === null
                      ? "text-gray-500"
                      : q.isCorrect
                        ? "text-green-700"
                        : "text-red-700"
                  }
                >
                  {q.given ?? "not attempted"}
                </strong>
                <span className="ml-4 text-gray-600">Correct: </span>
                <strong className="text-green-700">{q.correct}</strong>
              </p>

              {q.workingEn && (
                <p className="mt-2 rounded bg-gray-50 px-3 py-2 text-[12px] text-gray-700">
                  {q.workingEn}
                </p>
              )}
            </li>
          ))}
        </ol>

        <div className="mt-8 flex gap-3">
          <Link
            href={`/watch-table/${paperId}`}
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

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <PortalBanner showInstructions={false} showQuestionPaper={false} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-12 text-center">
        {children}
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
