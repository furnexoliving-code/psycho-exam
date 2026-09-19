"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveFeatures, type WatchPaper } from "@/lib/wt/types";
import { useAttempt } from "@/lib/wt/state";
import { useExamKeys, useScrollLock } from "@/lib/wt/useKeyboardOnly";
import { PortalBanner } from "./PortalBanner";
import { PortalToolbar } from "./PortalToolbar";
import { TestTabs } from "./TestTabs";
import { WatchTableDiagram } from "./WatchTableDiagram";
import { QuestionList } from "./QuestionList";
import { KeyboardHelpPanel } from "./KeyboardHelp";
import { Instructions, InstructionsDialog } from "./Instructions";
import { ScrollRail } from "./ScrollRail";
import { QuestionPaperView } from "./QuestionPaperView";
import { ConfirmBox } from "./ConfirmBox";

/**
 * The exam screen: the diagram fixed on the left, the questions scrolling on
 * the right, driven from the keyboard.
 */
export function WatchTableExam({
  paper,
  candidateName = "Candidate",
  rollNo = "—",
  elapsedSec = null,
}: {
  paper: WatchPaper;
  candidateName?: string;
  rollNo?: string;
  /** How long the server says this sitting has been running. */
  elapsedSec?: number | null;
}) {
  const router = useRouter();
  const { state, dispatch, answered, clearSaved } = useAttempt(paper, elapsedSec);
  const questionColumn = useRef<HTMLElement | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [paperOpen, setPaperOpen] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  // Fixed by the admin. Deliberately not adjustable by the candidate: every
  // student then sits the same paper at the same size.
  const fontScale = paper.fontScale ?? 1;
  // Bumped only by keyboard navigation, so a click never triggers a scroll.
  const [scrollToken, setScrollToken] = useState(0);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);

  // Which screen is up, and therefore which clock is running, lives in the
  // attempt so both survive a reload.
  const onTest = state.phase === "test";
  // Which controls this paper grants. Set per paper in the admin panel.
  const features = resolveFeatures(paper.features);
  const active =
    onTest &&
    !state.submitted &&
    !state.paused &&
    !helpOpen &&
    !confirmSubmit &&
    !confirmSkip &&
    !paperOpen &&
    !instructionsOpen;

  // The wheel is off during the test; the scrollbar and the keyboard still move
  // the column, and the mouse stays fully usable everywhere else.
  useScrollLock(features.lockScroll && state.scrollLocked && onTest && !state.submitted);

  const current = paper.questions[state.currentIndex];
  const table = paper.tables[current?.tableIndex ?? 0];

  const finish = useCallback(() => {
    dispatch({ type: "submit" });
    router.push(`/watch-table/${paper.id}/result`);
  }, [dispatch, router, paper.id]);

  const handlers = useMemo(
    () => ({
      onSelect: (optionIndex: number) => {
        if (!current) return;
        const value = current.options[optionIndex];
        if (value === undefined) return;
        dispatch({ type: "answer", questionId: current.id, value });
      },
      onNext: () => {
        dispatch({ type: "goto", index: state.currentIndex + 1 });
        setScrollToken((t) => t + 1);
      },
      onPrevious: () => {
        dispatch({ type: "goto", index: state.currentIndex - 1 });
        setScrollToken((t) => t + 1);
      },
      onFirst: () => {
        dispatch({ type: "goto", index: 0 });
        setScrollToken((t) => t + 1);
      },
      onLast: () => {
        dispatch({ type: "goto", index: paper.questions.length - 1 });
        setScrollToken((t) => t + 1);
      },
      onClear: () => {
        if (current) dispatch({ type: "clear", questionId: current.id });
      },
      onSubmit: () => setConfirmSubmit(true),
      onToggleHelp: () => setHelpOpen((v) => !v),
    }),
    [current, dispatch, state.currentIndex, paper.questions.length],
  );

  useExamKeys(handlers, active);

  const unanswered = paper.questions.length - answered;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <PortalBanner
        disabled={!onTest}
        showInstructions={features.showInstructionsButton}
        showQuestionPaper={features.showQuestionPaperButton}
        onInstructions={() => setInstructionsOpen(true)}
        onQuestionPaper={() => setPaperOpen(true)}
      />
      <PortalToolbar
        title={paper.displayName}
        label={onTest ? "Time Left" : "Instruction Time Left"}
        secondsLeft={onTest ? state.remainingSec : state.instructionRemainingSec}
        paused={state.paused}
        showPause={features.allowPause}
        showFullscreen={features.allowFullscreen}
        onTogglePause={() => dispatch({ type: "pause", paused: !state.paused })}
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
        <>
          <div className="flex min-h-0 flex-1">
            {/* Left portion — the fixed diagram. Never scrolls with questions. */}
            {/* Scrolls in BOTH directions: a diagram wider or taller than its
                half of the screen must stay reachable, not be cut off. */}
            <section
              className="flex w-1/2 shrink-0 flex-col items-center overflow-auto px-4 py-4"
              aria-label="Watch table diagram"
            >
              <div className="w-full max-w-[520px] text-[13px] font-bold text-gray-800">
                {table?.label}
              </div>
              {paper.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={paper.imageUrl}
                  alt="Watch table diagram"
                  className="mt-2 h-auto max-w-[520px]"
                  style={{ width: `${paper.imageWidthPct ?? 100}%` }}
                  draggable={false}
                />
              ) : (
                table && <WatchTableDiagram table={table} className="mt-2" />
              )}
            </section>

            {/* Right portion — the questions. The scrollbar stays visible so a
                candidate can see how much of the paper is left, and it can
                still be dragged; only the mouse wheel is off. */}
            {/* The rails are inset by their own 9px so they never sit over
                the question text. */}
            <div className="relative min-w-0 flex-1 border-l border-[#dcdcdc]">
            <section
              ref={questionColumn}
              className="wt-scroll-host h-full pb-[9px] pr-[9px]"
              style={{ fontSize: `${16 * fontScale}px` }}
              aria-label="Questions"
            >
              <QuestionList
                questions={paper.questions}
                answers={state.answers}
                currentIndex={state.currentIndex}
                locked={state.submitted}
                container={questionColumn}
                scrollToken={scrollToken}
                overflow={features.overflowQuestions}
                onSelect={(qi, oi) => {
                  const q = paper.questions[qi];
                  const value = q.options[oi];
                  // Sets the current question too, so the keys carry on from
                  // wherever the pointer left off — but without a scroll.
                  dispatch({ type: "goto", index: qi });
                  dispatch({ type: "answer", questionId: q.id, value });
                }}
              />
            </section>
            <ScrollRail target={questionColumn} axis="vertical" />
            <ScrollRail target={questionColumn} axis="horizontal" />
            </div>
          </div>

        </>
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
                Question {state.currentIndex + 1}
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
          <button
            type="button"
            data-allow-mouse="true"
            onClick={() => setConfirmSubmit(true)}
            className="ml-auto rounded bg-wt-submit px-8 py-2.5 text-[14px] font-semibold text-white hover:opacity-90"
          >
            Submit Test
          </button>
        ) : (
          // The only route from the instructions to the test.
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

      <KeyboardHelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />

      <InstructionsDialog
        paper={paper}
        open={instructionsOpen}
        onClose={() => setInstructionsOpen(false)}
      />

      <QuestionPaperView
        paper={paper}
        answers={state.answers}
        open={paperOpen}
        onClose={() => setPaperOpen(false)}
      />

      <ConfirmBox
        open={state.paused && !state.submitted}
        title="Test paused"
        body="The clock is stopped. Resume when you are ready."
        confirmLabel="Resume"
        cancelLabel="Stay paused"
        onConfirm={() => dispatch({ type: "pause", paused: false })}
        onCancel={() => undefined}
      />

      <ConfirmBox
        open={confirmSkip}
        title="Start the test now?"
        body="The instruction screen closes and the test's own 10 minute clock starts. You cannot come back to the instructions."
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
