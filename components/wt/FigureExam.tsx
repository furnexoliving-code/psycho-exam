"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveFeatures, type WatchPaper } from "@/lib/wt/types";
import { useAttempt } from "@/lib/wt/state";
import { useScrollLock } from "@/lib/wt/useKeyboardOnly";
import { PortalBanner } from "./PortalBanner";
import { PortalToolbar } from "./PortalToolbar";
import { TestTabs } from "./TestTabs";
import { Instructions, InstructionsDialog } from "./Instructions";
import { ConfirmBox } from "./ConfirmBox";

/**
 * The Perceptual Speed Test screen: the paper in parts, each question a
 * figure with its options beneath, answered with the mouse.
 *
 * The real test shows the questions a part at a time, with Part tabs on the
 * left and Save & Next moving to the next part. Everything behind the
 * screen — the attempt, its clocks, the snapshot sent to the server, the
 * submit — is the same machinery as the Following Directions paper; only
 * what is on screen differs, so that engine is left exactly as it is.
 */
export function FigureExam({
  paper,
  candidateName = "Candidate",
  rollNo = "—",
  elapsedSec = null,
  questionElapsedSec = null,
  storageOwner = "guest",
}: {
  paper: WatchPaper;
  candidateName?: string;
  rollNo?: string;
  elapsedSec?: number | null;
  questionElapsedSec?: number | null;
  storageOwner?: string;
}) {
  const router = useRouter();
  const { state, dispatch, answered, clearSaved } = useAttempt(
    paper,
    elapsedSec,
    questionElapsedSec,
    storageOwner,
  );
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);
  const column = useRef<HTMLDivElement | null>(null);

  const onTest = state.phase === "test";
  const features = resolveFeatures(paper.features);
  const fontScale = paper.fontScale ?? 1;

  // The same switch as the Following Directions paper: with the wheel off,
  // the scrollbar still drags and the Part tabs still move; only the wheel
  // and the Space/PageDown keys are refused, as in the hall.
  useScrollLock(features.lockScroll && onTest && !state.submitted);

  // The parts: a fixed number of questions each. Which part is open is kept
  // as the attempt's current question, so a reload lands on the same part.
  const perPart = Math.max(1, Math.floor(features.questionsPerPart) || 1);
  const partCount = Math.max(1, Math.ceil(paper.questions.length / perPart));
  const part = Math.min(partCount - 1, Math.floor(state.currentIndex / perPart));
  const parts = useMemo(
    () =>
      Array.from({ length: partCount }, (_, p) => paper.questions.slice(p * perPart, (p + 1) * perPart)),
    [paper.questions, partCount, perPart],
  );
  const goToPart = useCallback(
    (p: number) => {
      dispatch({ type: "goto", index: Math.min(Math.max(0, p), partCount - 1) * perPart });
      column.current?.scrollTo({ top: 0 });
    },
    [dispatch, partCount, perPart],
  );

  const finish = useCallback(() => {
    dispatch({ type: "submit" });
  }, [dispatch]);

  // Submitted — by the button, by the clock, or by the server — means the
  // result, at once.
  useEffect(() => {
    if (state.submitted && state.startedAt !== 0) {
      router.replace(`/watch-table/${paper.id}/result`);
    }
  }, [state.submitted, state.startedAt, router, paper.id]);

  // The sheet goes up to the server as it changes, so a browser that dies
  // mid-paper has lost nothing. The same as the Following Directions paper.
  const answersRef = useRef(state.answers);
  answersRef.current = state.answers;
  const sentRef = useRef<string>("");
  useEffect(() => {
    if (!onTestPhase(state)) return;
    const send = (keepalive: boolean) => {
      const answers = answersRef.current;
      const serialised = JSON.stringify(answers);
      if (serialised === sentRef.current) return;
      sentRef.current = serialised;
      void fetch("/api/watch-table/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId: paper.id, answers }),
        keepalive,
      }).catch(() => {
        sentRef.current = "";
      });
    };
    const timer = window.setTimeout(() => send(false), 1500);
    const onHide = () => {
      if (document.visibilityState === "hidden") send(true);
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [state, paper.id]);

  // Tell the server the moment the questions open, once: that is where the
  // time on the paper is measured from.
  const announcedStart = useRef(false);
  useEffect(() => {
    if (!onTestPhase(state) || announcedStart.current) return;
    announcedStart.current = true;
    void fetch("/api/watch-table/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paperId: paper.id }),
      keepalive: true,
    }).catch(() => undefined);
  }, [state, paper.id]);

  const unanswered = paper.questions.length - answered;
  const lastPart = part >= partCount - 1;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <PortalBanner
        disabled={!onTest}
        showInstructions={features.showInstructionsButton}
        showQuestionPaper={false}
        onInstructions={() => setInstructionsOpen(true)}
      />
      <PortalToolbar
        title={paper.displayName}
        label={onTest ? "Time Left" : "Instruction Time Left"}
        secondsLeft={onTest ? state.remainingSec : state.instructionRemainingSec}
        paused={state.paused}
        showPause={features.allowPause}
        showFullscreen={features.allowFullscreen}
        onTogglePause={() => dispatch({ type: "pause", paused: !state.paused, now: Date.now() })}
        onToggleFullscreen={() => {
          if (document.fullscreenElement) void document.exitFullscreen();
          else void document.documentElement.requestFullscreen().catch(() => {});
        }}
        rollNo={rollNo}
        name={candidateName}
      />
      <TestTabs
        activeId={state.phase}
        tabs={[
          { id: "instructions", label: `${paper.title} Instructions` },
          { id: "test", label: paper.title },
        ]}
      />

      {onTest ? (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* The parts, as the real portal's Sections strip. */}
          <div className="border-b border-[#dcdcdc] bg-white px-4 py-2">
            <div className="text-[12px] font-semibold text-gray-700">Sections</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {parts.map((group, p) => {
                const done = group.filter((q) => state.answers[q.id] !== null && state.answers[q.id] !== undefined).length;
                const active = p === part;
                return (
                  <button
                    key={p}
                    type="button"
                    data-allow-mouse="true"
                    onClick={() => goToPart(p)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2 rounded px-3 py-1 text-[12px] font-semibold ${
                      active ? "bg-wt-pill text-white" : "border border-wt-pill/40 bg-white text-wt-tealDark hover:bg-wt-bar"
                    }`}
                  >
                    Part {p + 1}
                    <span
                      className={`rounded-full px-1.5 text-[10px] ${active ? "bg-white/25" : "bg-wt-bar"}`}
                      aria-label={`${done} of ${group.length} answered`}
                    >
                      {done}/{group.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            ref={column}
            className="min-h-0 flex-1 overflow-y-auto px-5 py-4"
            style={{ fontSize: `${16 * fontScale}px` }}
          >
            <p className="text-[0.9em] text-[#494949]">
              Please Select Correct Answer /{" "}
              <span lang="hi">कृपया सही उत्तर चुनें</span>
            </p>

            <ol className="mt-3 space-y-6">
              {parts[part]?.map((q, i) => {
                const number = part * perPart + i + 1;
                const chosen = state.answers[q.id];
                return (
                  <li key={q.id} className="border-b border-[#ececec] pb-5">
                    <p className="text-[0.95em] font-bold text-[#222]">Question No : {number}</p>
                    {q.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      // The figure is drawn small, as the real test draws it:
                      // a fixed height, so every question's figure and its
                      // options sit at one size whatever was uploaded.
                      <img
                        src={q.image}
                        alt={`Question ${number}`}
                        className="mt-2 h-[72px] w-auto max-w-full"
                        draggable={false}
                      />
                    )}
                    {(q.prompt.en || q.prompt.hi) && (
                      <div className="mt-2 text-[1em] text-[#494949]">
                        {q.prompt.en && <p>{q.prompt.en}</p>}
                        {q.prompt.hi && <p lang="hi">{q.prompt.hi}</p>}
                      </div>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
                      {q.options.map((option, oi) => {
                        const id = `${q.id}-opt-${oi}`;
                        const selected = chosen === option;
                        const picture = q.optionImages?.[oi];
                        return (
                          <label
                            key={id}
                            htmlFor={id}
                            className="flex cursor-pointer items-center gap-1.5"
                          >
                            <input
                              id={id}
                              type="radio"
                              name={q.id}
                              checked={selected}
                              disabled={state.submitted}
                              data-allow-mouse="true"
                              onChange={() => dispatch({ type: "answer", questionId: q.id, value: option })}
                              className="h-[14px] w-[14px] cursor-pointer"
                            />
                            <span className="text-[1em] text-[#494949]">{String(option)}.</span>
                            {picture && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={picture}
                                alt={`Option ${String(option)}`}
                                className="h-[64px] w-auto"
                                draggable={false}
                              />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      ) : (
        <Instructions paper={paper} />
      )}

      <div className="flex items-center gap-4 border-t border-[#d3d3d3] bg-wt-bar px-4 py-3">
        <span className="text-[13px] text-gray-600">
          {onTest ? (
            <>
              Answered <strong className="text-gray-900">{answered}</strong> of{" "}
              {paper.questions.length}
              <span className="ml-3 text-gray-500">
                Part {part + 1} of {partCount}
              </span>
            </>
          ) : (
            <>
              The test opens by itself when the instruction time runs out.
              <span className="ml-2 text-gray-500" lang="hi">
                निर्देश का समय समाप्त होते ही परीक्षण स्वतः प्रारंभ हो जाएगा।
              </span>
            </>
          )}
        </span>

        {onTest ? (
          <div className="ml-auto flex items-center gap-3">
            {/* The answers are already saved as they are chosen; this button
                is the way to the next part, as in the real test. */}
            <button
              type="button"
              data-allow-mouse="true"
              disabled={lastPart}
              onClick={() => goToPart(part + 1)}
              className="rounded border border-wt-pill bg-white px-6 py-2.5 text-[14px] font-semibold text-wt-tealDark hover:bg-wt-bar disabled:opacity-40"
            >
              Save &amp; Next
            </button>
            <button
              type="button"
              data-allow-mouse="true"
              onClick={() => setConfirmSubmit(true)}
              className="rounded bg-wt-submit px-8 py-2.5 text-[14px] font-semibold text-white hover:opacity-90"
            >
              Submit
            </button>
          </div>
        ) : (
          <button
            type="button"
            data-allow-mouse="true"
            onClick={() => setConfirmSkip(true)}
            className="ml-auto rounded bg-wt-submit px-8 py-2.5 text-[14px] font-semibold text-white hover:opacity-90"
          >
            Skip Instruction
          </button>
        )}
      </div>

      <InstructionsDialog
        paper={paper}
        open={instructionsOpen}
        onClose={() => setInstructionsOpen(false)}
      />

      <ConfirmBox
        open={state.paused && !state.submitted}
        title="Test paused"
        body="The clock is stopped. Resume when you are ready."
        confirmLabel="Resume"
        cancelLabel="Stay paused"
        onConfirm={() => dispatch({ type: "pause", paused: false, now: Date.now() })}
        onCancel={() => undefined}
      />

      <ConfirmBox
        open={confirmSkip}
        title="Start the test now?"
        body={`The instruction screen closes and the test's own ${paper.timeLimitMin} minute clock starts. You cannot come back to the instructions.`}
        confirmLabel="Start test"
        cancelLabel="Keep reading"
        onConfirm={() => {
          setConfirmSkip(false);
          dispatch({ type: "begin-test" });
        }}
        onCancel={() => setConfirmSkip(false)}
      />

      <ConfirmBox
        open={confirmSubmit}
        title="Submit the test?"
        body={
          unanswered > 0
            ? `${unanswered} question${unanswered === 1 ? " is" : "s are"} still unanswered. You cannot return after submitting.`
            : "All questions are answered. You cannot return after submitting."
        }
        confirmLabel="Submit"
        cancelLabel="Go back"
        onConfirm={() => {
          setConfirmSubmit(false);
          clearSaved();
          finish();
        }}
        onCancel={() => setConfirmSubmit(false)}
      />
    </div>
  );
}

/** The test is on screen and the clock is running. */
function onTestPhase(state: { phase: string; submitted: boolean; startedAt: number }): boolean {
  return state.phase === "test" && !state.submitted && state.startedAt !== 0;
}
