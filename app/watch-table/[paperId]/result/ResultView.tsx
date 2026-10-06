"use client";

import { useRouter } from "next/navigation";
import { continueMock, type MockNext } from "@/app/mock/actions";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PortalBanner } from "@/components/wt/PortalBanner";
import type {
  CutOff,
  HistoryPoint,
  MarkedQuestion,
  StandingWire,
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
} from "@/components/wt/ResultPanels";
import { WatchTableDiagram } from "@/components/wt/WatchTableDiagram";
import { attemptStorageKey, type AttemptState } from "@/lib/wt/state";
import { resolveResultView, type ResultView as ResultFlags, type WatchTable } from "@/lib/wt/types";
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
 * The page is handed no answer key. On the submit it posts what the candidate
 * chose; the server keeps that copy with the sitting and every later visit is
 * marked from it, so this page shows the same result on a reload, on another
 * device, or after the browser's own copy is gone — and opening it before
 * submitting shows nothing.
 */

export function ResultView({
  paperId,
  displayName,
  allowedSec,
  table,
  imageUrl,
  imageWidthPct,
  kind = "directions",
  studyImages = [],
  questionsPerPart = 10,
  storageOwner = "guest",
  mock,
}: {
  paperId: string;
  displayName: string;
  /** The paper's own time limit, for the time panel. */
  allowedSec: number;
  /** The paper's diagram, shown beside the review. */
  table: WatchTable;
  imageUrl?: string;
  imageWidthPct?: number;
  /** A Perceptual Speed paper's review has no diagram beside it: each question carries its own picture. */
  kind?: "directions" | "figure";
  /** A Memory Test paper's study screens: each part's picture is shown again above its questions. */
  studyImages?: string[];
  questionsPerPart?: number;
  /** Whose attempt to look for in this browser. */
  storageOwner?: string;
  /** Set when this test was sat as part of a Full Mock: the mock moves on from here. */
  mock?: { name: string; step: number; total: number; gapSec: number };
}) {
  const [marked, setMarked] = useState<MarkedQuestion[] | null>(null);
  const [score, setScore] = useState<Score | null>(null);
  const [tScore, setTScore] = useState<TScore | null>(null);
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [standing, setStanding] = useState<StandingWire | null>(null);
  const [cutOff, setCutOff] = useState<CutOff | null>(null);
  const [comment, setComment] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [takenSec, setTakenSec] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<Required<ResultFlags>>(resolveResultView());
  const [state, setState] = useState<"loading" | "missing" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const storageKey = attemptStorageKey(storageOwner, paperId);

      // The browser's copy of the attempt, if there is one. Its absence is not
      // a missing result any more: the server holds the submission.
      let attempt: AttemptState | null = null;
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw) attempt = JSON.parse(raw) as AttemptState;
      } catch {
        attempt = null;
      }

      const answers = attempt?.answers ?? {};
      // The submit that ends the attempt is sent once. A reload asks for the
      // result the server already holds rather than submitting again.
      const record = attempt?.submitted === true && attempt.recorded !== true;

      // The browser's own estimate, only until the server's measurement lands.
      const spent =
        typeof attempt?.remainingSec === "number"
          ? Math.max(0, allowedSec - attempt.remainingSec)
          : null;
      setTakenSec(spent);

      try {
        const response = await fetch("/api/watch-table/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paperId, answers, record }),
        });

        if (response.status === 401) {
          // The session ended between the paper and its result.
          window.location.assign(
            `/login?next=${encodeURIComponent(window.location.pathname)}`,
          );
          return;
        }
        if (response.status === 403) {
          if (!cancelled) setState("missing");
          return;
        }
        if (!response.ok) throw new Error(String(response.status));

        const data = (await response.json()) as {
          questions: MarkedQuestion[];
          score: Score;
          tScore: TScore | null;
          topics: TopicRow[];
          standing: StandingWire | null;
          cutOff: CutOff | null;
          expertComment: string | null;
          durationSec?: number | null;
          history?: HistoryPoint[];
          view?: ResultFlags;
        };
        if (cancelled) return;

        if (record && attempt) {
          try {
            window.localStorage.setItem(
              storageKey,
              JSON.stringify({ ...attempt, recorded: true }),
            );
          } catch {
            // If storage is unavailable the server still refuses a second
            // record for the same sitting, so nothing is counted twice.
          }
        }

        setView(resolveResultView(data.view));
        // The server measured this sitting; its figure beats the browser's own
        // estimate.
        if (typeof data.durationSec === "number") setTakenSec(data.durationSec);
        setHistory(data.history ?? []);
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
  }, [paperId, allowedSec, storageOwner]);

  if (state === "missing" || state === "error") {
    return (
      <Shell>
        <h1 className="text-xl font-bold text-gray-900">
          {state === "missing" ? "Nothing submitted yet" : "Could not load your result"}
        </h1>
        <p className="mt-2 text-[14px] text-gray-600">
          {state === "missing"
            ? "You have not submitted this paper yet. Sit it and submit, and the result appears here."
            : "Something went wrong while marking the paper. Try again."}
        </p>
        {state === "missing" ? (
          <Link
            href={`/watch-table/${paperId}`}
            className="mt-6 inline-block rounded bg-wt-submit px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Go to the test
          </Link>
        ) : (
          // A retry, not a route back into the paper: the answers are still
          // here and the server still holds the sitting, so asking again is
          // all it takes.
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-block rounded bg-wt-submit px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Try again
          </button>
        )}
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

  // Inside a mock the marks wait for the scorecard; this screen is the gap
  // before the next test, and it opens that test by itself.
  if (mock) {
    return (
      <Shell>
        <MockGap paperId={paperId} mock={mock} />
      </Shell>
    );
  }

  return (
    <div className="viz flex min-h-screen flex-col" style={{ background: "var(--plane)" }}>
      <PortalBanner showInstructions={false} showQuestionPaper={false} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
        <header
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl px-6 py-5 text-white shadow-lg"
          style={{ background: "linear-gradient(120deg,#1565b0 0%,#1668b0 45%,#0f766e 100%)" }}
        >
          <div className="flex items-center gap-4">
            <span aria-hidden="true" className="text-[40px] leading-none">📊</span>
            <div>
              <h1 className="text-[26px] font-extrabold leading-tight">Your Result</h1>
              <p className="mt-0.5 text-[13px] text-white/85">{displayName}</p>
            </div>
          </div>
          <span className="rounded-full bg-white/15 px-4 py-1.5 text-[12px] font-semibold">
            ✨ {score.correct} of {score.total} correct
          </span>
        </header>

        {/* The hero figure, with the expert's word beside it when there is one. */}
        <div className={`mt-5 grid gap-4 ${comment && view.expertComment ? "lg:grid-cols-2" : ""}`}>
          <TScoreHero
            tScore={tScore}
            marks={score.correct}
            total={score.total}
            showFormula={view.tScoreFormula}
            showStats={view.tScoreStats}
            showTScore={view.tScore}
          />
          {view.expertComment && <ExpertComment comment={comment} />}
        </div>

        <div className="mt-4">
          <CutOffBanner cutOff={cutOff} />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {tScore && (
            <Stat label="Score" value={String(score.correct)} foot={`of ${score.total}`} emoji="🏆" tone="amber" />
          )}
          <Stat label="Attempted" value={String(score.attempted)} foot={`of ${score.total}`} emoji="✍️" tone="blue" />
          <Stat label="Incorrect" value={String(score.wrong)} emoji="❌" tone="red" />
          {view.accuracy && (
            <Stat label="Accuracy" value={`${score.accuracy.toFixed(0)}%`} foot="of attempted" emoji="🎯" tone="green" />
          )}
          <StandingCards standing={standing} showRank={view.rank} showPercentile={view.percentile} />
        </div>

        <div className="mt-4 space-y-4">
          {view.topicBreakdown && <TopicBreakdown topics={topics} />}
          <div className="grid gap-4 lg:grid-cols-2">
            {view.timeAnalysis && (
              <TimeAnalysis
                takenSec={takenSec}
                allowedSec={allowedSec}
                attempted={score.attempted}
              />
            )}
            {view.attemptHistory && <AttemptHistory attempts={history} />}
          </div>
        </div>

        {view.review && (
        <div className="mt-8">
          <h2
            className="flex items-center gap-2 text-[18px] font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            <span aria-hidden="true" className="text-[22px] leading-none">🔍</span>
            Review
          </h2>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-secondary)" }}>
            {kind === "figure"
              ? "Each question is shown with its figure, your answer and the correct one."
              : "The diagram stays beside the questions, so each one can be worked through again against it."}
          </p>

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

          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-start">
            {/* Left half — the diagram. Sticky rather than repeated per question:
                one paper has one diagram, and scrolling must not lose sight of it.
                A picture paper has none: each question shows its own. */}
            {kind !== "figure" && (
            <aside className="lg:sticky lg:top-4 lg:w-1/2 lg:shrink-0">
              <Card>
                {/* Capped and scrollable: a tall diagram must not push the
                    questions off the screen it is meant to sit beside. */}
                <div className="flex max-h-[80vh] justify-center overflow-auto">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt="Watch table diagram"
                      className="h-auto max-w-full"
                      style={{ width: `${imageWidthPct ?? 100}%` }}
                    />
                  ) : (
                    <WatchTableDiagram table={table} />
                  )}
                </div>
              </Card>
            </aside>
            )}

            <ol className="min-w-0 flex-1 space-y-3">
            {visible.map(({ q, i }, vi) => {
              const outcome = groupOf(q);
              // On a Memory Test paper, each part's study screen sits above
              // its questions, as it did in the test — the review then shows
              // what was to be remembered next to what was answered.
              const perPart = Math.max(1, Math.floor(questionsPerPart) || 1);
              const partNo = Math.floor(i / perPart);
              const previous = vi > 0 ? Math.floor(visible[vi - 1].i / perPart) : -1;
              const study = studyImages.length > 0 && partNo !== previous ? studyImages[partNo] : undefined;
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
                  {study && (
                    <div
                      className="-mx-4 -mt-4 mb-4 rounded-t-lg px-4 py-3"
                      style={{ background: "var(--plane)", borderBottom: "1px solid var(--hairline)" }}
                    >
                      <p className="text-[12px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                        Study Screen Part {partNo + 1} / <span lang="hi">अध्ययन स्क्रीन भाग -{partNo + 1}</span>
                      </p>
                      <div className="mt-2 inline-block border border-[#555] bg-white p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={study}
                          alt={`Study screen for part ${partNo + 1}`}
                          className="h-auto max-h-[50vh] max-w-full"
                          draggable={false}
                        />
                      </div>
                      <p className="mt-3 text-[12px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                        Test Screen Part {partNo + 1} / <span lang="hi">परीक्षण स्क्रीन भाग -{partNo + 1}</span>
                      </p>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[12px] font-semibold" style={{ color: "var(--text-muted)" }}>
                      Q. {i + 1}
                    </span>
                    <OutcomeTag outcome={outcome} />
                  </div>

                  {q.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={q.image}
                      alt=""
                      className="mt-2 h-[72px] w-auto max-w-full"
                      draggable={false}
                    />
                  )}
                  {q.optionImages && q.optionImages.length > 0 && (
                    // The options as the candidate saw them, with their own
                    // choice and (when the key is shown) the right one marked.
                    <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-2">
                      {q.options.map((option, oi) => {
                        const mine = q.given === option;
                        const right = view.correctAnswers && q.correct === option;
                        const ring = right
                          ? "var(--good)"
                          : mine
                            ? "var(--critical)"
                            : "transparent";
                        return (
                          <span key={String(option)} className="flex flex-col items-center gap-1 text-[12px]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={q.optionImages![oi]}
                              alt={`Option ${String(option)}`}
                              className="h-[64px] w-auto rounded"
                              style={{ outline: `3px solid ${ring}`, outlineOffset: 2 }}
                              draggable={false}
                            />
                            <span style={{ color: "var(--text-secondary)" }}>
                              {String(option)}
                              {mine && <span className="ml-1 font-semibold" style={{ color: right ? "var(--good)" : "var(--critical)" }}>{right ? "✓ you" : "✕ you"}</span>}
                              {right && !mine && <span className="ml-1 font-semibold" style={{ color: "var(--good)" }}>✓</span>}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {q.promptEn && (
                  <p className="mt-1.5 text-[15px]" style={{ color: "var(--text-primary)" }}>
                    {q.promptEn}
                  </p>
                  )}
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
                    {view.correctAnswers && (
                      <span style={{ color: "var(--text-secondary)" }}>
                        Correct:{" "}
                        <strong style={{ color: "var(--text-primary)" }}>{q.correct}</strong>
                      </span>
                    )}
                    {q.topic && (
                      <span
                        className="rounded px-2 py-0.5 text-[11px]"
                        style={{ background: "var(--plane)", color: "var(--text-secondary)" }}
                      >
                        {q.topic}
                      </span>
                    )}
                  </p>

                </li>
              );
            })}
            </ol>
          </div>
        </div>
        )}

        <div className="mt-8 flex gap-3">
          <Link
            href={`/watch-table/${paperId}`}
            className="rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: "linear-gradient(120deg,#1565b0,#0f766e)" }}
          >
            🔁 Re-attempt
          </Link>
          {/* The candidate's own page, not the public front door — after a
              test, "home" means where their tests and results are. */}
          <Link
            href="/dashboard"
            className="rounded-xl px-6 py-2.5 text-sm font-bold"
            style={{
              background: "var(--surface-1)",
              color: "var(--text-secondary)",
              border: "1px solid var(--hairline)",
            }}
          >
            🏠 Home
          </Link>
        </div>
      </main>
    </div>
  );
}

/**
 * The gap between two tests of a Full Mock. The mock is moved on as soon
 * as this test's attempt is on record, then the next test opens when the
 * gap runs out — with no way back, as in the hall.
 */
function MockGap({ paperId, mock }: { paperId: string; mock: { name: string; step: number; total: number; gapSec: number } }) {
  const router = useRouter();
  const [next, setNext] = useState<MockNext | null>(null);
  const [left, setLeft] = useState(mock.gapSec);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    continueMock(paperId)
      .then((n) => {
        if (cancelled) return;
        setNext(n);
        if (n.next === "done") router.replace(n.url);
        if (n.next === "none") router.replace("/dashboard");
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [paperId, router]);

  useEffect(() => {
    if (!next || next.next !== "paper") return;
    if (left <= 0) {
      router.replace(next.url);
      return;
    }
    const t = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [left, next, router]);

  const mm = String(Math.floor(Math.max(0, left) / 60)).padStart(2, "0");
  const ss = String(Math.max(0, left) % 60).padStart(2, "0");

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">{mock.name}</div>
      <h1 className="mt-1 text-xl font-bold text-gray-900">
        Test {mock.step + 1} of {mock.total} submitted ✓
      </h1>
      {failed ? (
        <>
          <p className="mt-3 text-[14px] text-red-700">The mock could not be moved on. Check the connection and try again.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded bg-wt-submit px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Try again
          </button>
        </>
      ) : next?.next === "paper" ? (
        <>
          <p className="mt-3 text-[14px] text-gray-600">
            Test {next.step + 1} of {next.total} opens by itself in
          </p>
          <div className="mt-2 font-mono text-[40px] font-bold tabular-nums text-gray-900">
            {mm}:{ss}
          </div>
          <p className="mt-3 text-[12px] text-gray-500">
            Stay on this page. Your marks for every test come together on the scorecard at the end.
          </p>
        </>
      ) : (
        <p className="mt-3 text-[14px] text-gray-600">Saving your answers…</p>
      )}
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
