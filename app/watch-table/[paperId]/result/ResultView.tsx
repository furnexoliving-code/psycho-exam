"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PortalBanner } from "@/components/wt/PortalBanner";
import type { MarkedQuestion } from "@/app/api/watch-table/score/route";
import type { AttemptState } from "@/lib/wt/state";
import { formatTScore, type TScore } from "@/lib/wt/tscore";

interface Score {
  total: number;
  attempted: number;
  correct: number;
  wrong: number;
  accuracy: number;
}

type Filter = "all" | "correct" | "incorrect" | "unattempted";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "correct", label: "Correct" },
  { id: "incorrect", label: "Incorrect" },
  { id: "unattempted", label: "Unattempted" },
];

function groupOf(q: MarkedQuestion): Exclude<Filter, "all"> {
  if (q.given === null) return "unattempted";
  return q.isCorrect ? "correct" : "incorrect";
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
  const [tScore, setTScore] = useState<TScore | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [state, setState] = useState<"loading" | "missing" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const storageKey = `wt-attempt:${paperId}`;
      let attempt: AttemptState;
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) {
          setState("missing");
          return;
        }
        attempt = JSON.parse(raw) as AttemptState;
      } catch {
        setState("missing");
        return;
      }

      const answers = attempt.answers ?? {};
      // Count this paper into the cohort once, on the first visit after
      // submitting. Reloading the result must not enter it a second time.
      const record = attempt.submitted === true && attempt.recorded !== true;

      try {
        const response = await fetch("/api/watch-table/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paperId, answers, record }),
        });
        if (!response.ok) throw new Error(String(response.status));

        const data = (await response.json()) as {
          questions: MarkedQuestion[];
          score: Score;
          tScore: TScore | null;
        };
        if (cancelled) return;

        if (record) {
          try {
            window.localStorage.setItem(
              storageKey,
              JSON.stringify({ ...attempt, recorded: true }),
            );
          } catch {
            // If storage is unavailable the worst case is a second count, which
            // is better than losing the result the candidate is waiting for.
          }
        }

        setMarked(data.questions);
        setScore(data.score);
        setTScore(data.tScore);
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

  // Question numbers stay the paper's own, so filtering never renumbers a
  // question out from under the candidate.
  const numbered = (marked ?? []).map((q, i) => ({ q, i }));
  const visible =
    filter === "all" ? numbered : numbered.filter(({ q }) => groupOf(q) === filter);

  const counts: Record<Filter, number> = {
    all: numbered.length,
    correct: numbered.filter(({ q }) => groupOf(q) === "correct").length,
    incorrect: numbered.filter(({ q }) => groupOf(q) === "incorrect").length,
    unattempted: numbered.filter(({ q }) => groupOf(q) === "unattempted").length,
  };

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

        <TScoreCard tScore={tScore} marks={score.correct} />

        <h2 className="mt-8 text-[16px] font-bold text-gray-900">Review</h2>

        <div className="mt-3 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const n = counts[f.id];
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`rounded-full border px-4 py-1.5 text-[13px] font-semibold ${
                  active
                    ? "border-wt-submit bg-wt-submit text-white"
                    : "border-gray-400 bg-white text-gray-800 hover:bg-gray-100"
                }`}
                aria-pressed={active}
              >
                {f.label}
                <span className={`ml-2 ${active ? "text-white/80" : "text-gray-500"}`}>
                  {n}
                </span>
              </button>
            );
          })}
        </div>

        {visible.length === 0 && (
          <p className="mt-4 rounded border border-gray-300 bg-white px-4 py-6 text-center text-[13px] text-gray-500">
            Nothing in this group.
          </p>
        )}

        <ol className="mt-3 space-y-3">
          {visible.map(({ q, i }) => (
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

/**
 * The T-score, with the arithmetic shown. A single number nobody can check is
 * worth less than one they can.
 */
function TScoreCard({ tScore, marks }: { tScore: TScore | null; marks: number }) {
  if (!tScore) {
    return (
      <div className="mt-4 rounded border border-gray-300 bg-white px-4 py-3">
        <div className="text-[11px] uppercase tracking-wide text-gray-500">T-Score</div>
        <p className="mt-1 text-[13px] text-gray-600">
          Not available yet. It compares a candidate against everyone who has sat
          this paper, so it needs either enough submitted attempts or the
          reference mean and standard deviation set in the admin panel.
        </p>
      </div>
    );
  }

  const { cohort } = tScore;

  return (
    <div className="mt-4 rounded border border-gray-300 bg-white px-4 py-4">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-[11px] uppercase tracking-wide text-gray-500">T-Score</span>
        <span className="text-3xl font-bold text-wt-submit">
          {formatTScore(tScore.value)}
        </span>
        <span className="text-[12px] text-gray-500">
          50 is the average candidate; every 10 points is one standard deviation.
        </span>
      </div>

      <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-[12px] text-gray-700">
        <Pair label="Your marks" value={String(marks)} />
        <Pair label="Mean" value={cohort.mean.toFixed(2)} />
        <Pair label="Standard deviation" value={cohort.sd.toFixed(2)} />
        <Pair
          label={cohort.source === "cohort" ? "Papers compared" : "Reference figures"}
          value={cohort.source === "cohort" ? String(cohort.count) : "set by institute"}
        />
      </dl>

      <p className="mt-3 rounded bg-gray-50 px-3 py-2 font-mono text-[12px] text-gray-700">
        T = 50 + 10 × ({marks} − {cohort.mean.toFixed(2)}) ÷ {cohort.sd.toFixed(2)} ={" "}
        {formatTScore(tScore.value)}
      </p>

      {tScore.note && (
        <p className="mt-2 text-[12px] text-amber-800">{tScore.note}</p>
      )}
    </div>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className="text-gray-500">{label}:</dt>
      <dd className="font-semibold text-gray-900">{value}</dd>
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
