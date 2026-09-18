"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { WatchPaper } from "@/lib/wt/types";
import { useAttempt } from "@/lib/wt/state";
import { useExamKeys, useMouseSuppression } from "@/lib/wt/useKeyboardOnly";
import { PortalBanner } from "./PortalBanner";
import { PortalToolbar } from "./PortalToolbar";
import { TestTabs } from "./TestTabs";
import { WatchTableDiagram } from "./WatchTableDiagram";
import { QuestionList } from "./QuestionList";
import { KeyStrip, KeyboardHelpPanel } from "./KeyboardHelp";
import { Instructions } from "./Instructions";
import { ConfirmBox } from "./ConfirmBox";

/**
 * The exam screen: the diagram fixed on the left, the questions scrolling on
 * the right, driven from the keyboard.
 */
export function WatchTableExam({ paper }: { paper: WatchPaper }) {
  const router = useRouter();
  const { state, dispatch, answered, clearSaved } = useAttempt(paper);
  const [tab, setTab] = useState<"instructions" | "test">("instructions");
  const [helpOpen, setHelpOpen] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const onTest = tab === "test";
  const active = onTest && !state.submitted && !state.paused && !helpOpen && !confirmSubmit;

  useMouseSuppression(state.keyboardOnly && onTest && !state.submitted);

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
      onNext: () => dispatch({ type: "goto", index: state.currentIndex + 1 }),
      onPrevious: () => dispatch({ type: "goto", index: state.currentIndex - 1 }),
      onFirst: () => dispatch({ type: "goto", index: 0 }),
      onLast: () => dispatch({ type: "goto", index: paper.questions.length - 1 }),
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
        onInstructions={() => setTab("instructions")}
        onQuestionPaper={() => setTab("test")}
      />
      <PortalToolbar
        title={paper.displayName}
        secondsLeft={state.remainingSec}
        paused={state.paused}
        onTogglePause={() => dispatch({ type: "pause", paused: !state.paused })}
        onToggleFullscreen={() => {
          if (document.fullscreenElement) void document.exitFullscreen();
          else void document.documentElement.requestFullscreen().catch(() => {});
        }}
        rollNo="—"
        name="Candidate"
      />
      <TestTabs
        activeId={tab}
        onSelect={(id) => setTab(id as "instructions" | "test")}
        tabs={[
          { id: "instructions", label: `${paper.title} Instructions` },
          { id: "test", label: paper.title },
        ]}
      />

      {onTest ? (
        <>
          <div className="flex min-h-0 flex-1 divide-x divide-gray-300">
            {/* Left portion — the fixed diagram. Never scrolls with questions. */}
            <section
              className="flex w-1/2 shrink-0 flex-col items-center overflow-y-auto px-4 py-4"
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
                  className="mt-2 h-auto w-full max-w-[520px]"
                  draggable={false}
                />
              ) : (
                table && <WatchTableDiagram table={table} className="mt-2" />
              )}
            </section>

            {/* Right portion — the questions. */}
            <section className="min-w-0 flex-1 overflow-y-auto" aria-label="Questions">
              <QuestionList
                questions={paper.questions}
                answers={state.answers}
                currentIndex={state.currentIndex}
                keyboardOnly={state.keyboardOnly}
                locked={state.submitted}
                onSelect={(qi, oi) => {
                  const q = paper.questions[qi];
                  const value = q.options[oi];
                  dispatch({ type: "goto", index: qi });
                  dispatch({ type: "answer", questionId: q.id, value });
                }}
                onFocusQuestion={(index) => dispatch({ type: "goto", index })}
              />
            </section>
          </div>

          <KeyStrip />
        </>
      ) : (
        <Instructions paper={paper} onBegin={() => setTab("test")} />
      )}

      <div className="flex items-center gap-4 border-t border-gray-300 bg-white px-4 py-3">
        <span className="text-[13px] text-gray-600">
          Answered <strong className="text-gray-900">{answered}</strong> of{" "}
          {paper.questions.length}
          {onTest && (
            <span className="ml-3 text-gray-500">
              Question {state.currentIndex + 1}
            </span>
          )}
        </span>

        <button
          type="button"
          data-allow-mouse="true"
          onClick={() => setConfirmSubmit(true)}
          className="ml-auto rounded bg-wt-submit px-8 py-2.5 text-[14px] font-semibold text-white hover:opacity-90"
        >
          Submit Test
        </button>
      </div>

      <KeyboardHelpPanel
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        keyboardOnly={state.keyboardOnly}
        onToggleKeyboardOnly={(on) => dispatch({ type: "keyboard-only", on })}
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
