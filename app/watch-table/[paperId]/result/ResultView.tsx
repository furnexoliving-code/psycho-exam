"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PortalBanner } from "@/components/wt/PortalBanner";
import type {
  CutOff,
  MarkedQuestion,
  Standing,
  TopicRow,
} from "@/app/api/watch-table/score/route";
import {
  AttemptHistory,
  Card,
  CutOffBanner,
  ExpertComment,
  OUTCOME,
  OutcomeTag,
  StandingCards,
  Stat,
  TScoreHero,
  TimeAnalysis,
  TopicBreakdown,
  type Outcome,
  type PastAttempt,
} from "@/components/wt/ResultPanels";
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

function groupOf(q: MarkedQuestion): Outcome {
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
const HISTORY_KEY = (paperId: string) => `wt-history:${paperId}`;

export function ResultView({
  paperId,
  displayName,
  allowedSec,
}: {
  paperId: string;
  displayName: string;
  /** The paper's own time limit, for the time panel. */
  allowedSec: number;
}) {
  const [marked, setMarked] = useState<MarkedQuestion[] | null>(null);
  const [score, setScore] = useState<Score | null>(null);
  const [tScore, setTScore] = useState<TScore | null>(null);
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [standing, setStanding] = useState<Standing | null>(null);
  const [cutOff, setCutOff] = useState<CutOff | null>(null);
  const [comment, setComment] = useState<string | null>(null);
  const [history, setHistory] = useState<PastAttempt[]>([]);
  const [takenSec, setTakenSec] = useState<number | null>(null);
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

      // What was actually spent on the questions: the paper's limit less
      // whatever was still on the clock.
      const spent =
        typeof attempt.remainingSec === "number"
          ? Math.max(0, allowedSec - attempt.remainingSec)
          : null;
      setTakenSec(spent);

      try {
        const response = await fetch("/api/watch-table/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paperId, answers, record, durationSec: spent }),
        });
        if (!response.ok) throw new Error(String(response.status));

        const data = (await response.json()) as {
          questions: MarkedQuestion[];
          score: Score;
          tScore: TScore | null;
          topics: TopicRow[];
          standing: Standing | null;
          cutOff: CutOff | null;
          expertComment: string | null;
        };
        if (cancelled) return;

        // Attempt history is kept in the browser as well as the database, so
        // it works for a candidate who never signed in.
        let past: PastAttempt[] = [];
        try {
          past = JSON.parse(
            window.localStorage.getItem(HISTORY_KEY(paperId)) ?? "[]",
          ) as PastAttempt[];
        } catch {
          past = [];
        }

        if (record) {
          past = [
            ...past,
            {
              at: Date.now(),
              marks: data.score.correct,
              total: data.score.total,
              attempted: data.score.attempted,
              durationSec: spent,
            },
          ].slice(-10);

          try {
            window.localStorage.setItem(HISTORY_KEY(paperId), JSON.stringify(past));
            window.localStorage.setItem(
              storageKey,
              JSON.stringify({ ...attempt, recorded: true }),
            );
          } catch {
            // If storage is unavailable the worst case is a second count, which
            // is better than losing the result the candidate is waiting for.
          }
        }

        setHistory(past);
        setMarked(data.questions);
        setScore(data.score);
        setTScore(data.tScore);
        setTopics(data.topics ?? []);
        setStanding(data.standing);
        setCutOff(data.cutOff);
        setComment(data.expertComment);
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [paperId, allowedSec]);

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
    <div className="viz flex min-h-screen flex-col" style={{ background: "var(--plane)" }}>
      <PortalBanner showInstructions={false} showQuestionPaper={false} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
        <header>
          <h1
            className="text-[26px] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Analysis
          </h1>
          <p className="mt-0.5 text-[13px]" style={{ color: "var(--text-muted)" }}>
            {displayName}
          </p>
        </header>

        {/* The one hero figure on this view. */}
        <div className="mt-5">
          <TScoreHero tScore={tScore} marks={score.correct} total={score.total} />
        </div>

        <div className="mt-4">
          <CutOffBanner cutOff={cutOff} />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {tScore && (
            <Stat label="Score" value={String(score.correct)} foot={`of ${score.total}`} />
          )}
          <Stat label="Attempted" value={String(score.attempted)} foot={`of ${score.total}`} />
          <Stat label="Incorrect" value={String(score.wrong)} />
          <Stat label="Accuracy" value={`${score.accuracy.toFixed(0)}%`} foot="of attempted" />
          <StandingCards standing={standing} />
        </div>

        <div className="mt-4 space-y-4">
          <ExpertComment comment={comment} />
          <TopicBreakdown topics={topics} />
          <div className="grid gap-4 lg:grid-cols-2">
            <TimeAnalysis
              takenSec={takenSec}
              allowedSec={allowedSec}
              attempted={score.attempted}
            />
            <AttemptHistory attempts={history} />
          </div>
        </div>

        <div className="mt-8">
          <h2
            className="text-[17px] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Review
          </h2>

          <div className="mt-3 flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              const mark = f.id === "all" ? null : OUTCOME[f.id];
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  aria-pressed={active}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors"
                  style={{
                    background: active ? "var(--text-primary)" : "var(--surface-1)",
                    color: active ? "#ffffff" : "var(--text-secondary)",
                    border: "1px solid var(--hairline)",
                  }}
                >
                  {mark && (
                    <span
                      aria-hidden="true"
                      className="flex h-[16px] w-[16px] items-center justify-center rounded-full text-[10px] text-white"
                      style={{ background: mark.color }}
                    >
                      {mark.glyph}
                    </span>
                  )}
                  {f.label}
                  <span
                    className="tabular-nums"
                    style={{ color: active ? "rgba(255,255,255,0.7)" : "var(--text-muted)" }}
                  >
                    {counts[f.id]}
                  </span>
                </button>
              );
            })}
          </div>

          {visible.length === 0 && (
            <Card className="mt-4">
              <p className="text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
                Nothing in this group.
              </p>
            </Card>
          )}

          <ol className="mt-4 space-y-3">
            {visible.map(({ q, i }) => {
              const outcome = groupOf(q);
              return (
                <li
                  key={q.id}
                  data-outcome={outcome}
                  className="rounded-lg p-4"
                  style={{
                    background: "var(--surface-1)",
                    border: "1px solid var(--hairline)",
                    borderLeft: `4px solid ${OUTCOME[outcome].color}`,
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[12px] font-semibold" style={{ color: "var(--text-muted)" }}>
                      Q. {i + 1}
                    </span>
                    <OutcomeTag outcome={outcome} />
                  </div>

                  <p className="mt-1.5 text-[15px]" style={{ color: "var(--text-primary)" }}>
                    {q.promptEn}
                  </p>
                  {q.promptHi && (
                    <p className="text-[15px]" style={{ color: "var(--text-secondary)" }} lang="hi">
                      {q.promptHi}
                    </p>
                  )}

                  <p className="mt-2 flex flex-wrap gap-x-6 text-[13px]">
                    <span style={{ color: "var(--text-secondary)" }}>
                      Your answer:{" "}
                      <strong style={{ color: "var(--text-primary)" }}>
                        {q.given ?? "not attempted"}
                      </strong>
                    </span>
                    <span style={{ color: "var(--text-secondary)" }}>
                      Correct:{" "}
                      <strong style={{ color: "var(--text-primary)" }}>{q.correct}</strong>
                    </span>
                    {q.topic && (
                      <span
                        className="rounded px-2 py-0.5 text-[11px]"
                        style={{ background: "var(--plane)", color: "var(--text-secondary)" }}
                      >
                        {q.topic}
                      </span>
                    )}
                  </p>

                  {q.workingEn && (
                    <p
                      className="mt-2 rounded px-3 py-2 text-[12px]"
                      style={{ background: "var(--plane)", color: "var(--text-secondary)" }}
                    >
                      {q.workingEn}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-8 flex gap-3">
          <Link
            href={`/watch-table/${paperId}`}
            className="rounded-lg px-6 py-2 text-sm font-semibold text-white"
            style={{ background: "var(--text-primary)" }}
          >
            Re-attempt
          </Link>
          <Link
            href="/"
            className="rounded-lg px-6 py-2 text-sm font-semibold"
            style={{
              background: "var(--surface-1)",
              color: "var(--text-secondary)",
              border: "1px solid var(--hairline)",
            }}
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
