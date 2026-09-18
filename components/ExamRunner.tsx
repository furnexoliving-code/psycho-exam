"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useExam } from "@/lib/exam-store";
import { summarise } from "@/lib/scoring";
import type { Question } from "@/lib/types";
import { AnswerGrid } from "./AnswerGrid";
import { ConfirmDialog } from "./ConfirmDialog";
import { ExamChrome } from "./ExamChrome";
import { QuestionPalette } from "./QuestionPalette";
import { RrbHeader } from "./RrbHeader";
import { SectionInstructions } from "./SectionInstructions";
import { Stimulus } from "./Stimulus";
import { StudyPhase } from "./StudyPhase";
import { VersionBar } from "./VersionBar";

type Pending =
  | { kind: "switch-section"; sectionId: string }
  | { kind: "next-section" }
  | { kind: "submit" }
  | null;

export function ExamRunner({ title = "RRB ALP Aptitude Test" }: { title?: string }) {
  const router = useRouter();
  const { test, state, dispatch } = useExam();
  const [pending, setPending] = useState<Pending>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const section = test.sections.find((s) => s.id === state.currentSectionId)!;
  const runtime = state.sections[section.id];
  const sectionIndex = test.sections.findIndex((s) => s.id === section.id);
  const block = section.blocks[state.currentBlockIndex];

  const questionsByBlock = useMemo(() => {
    const map = new Map<string, Question[]>();
    for (const q of section.questions) {
      const list = map.get(q.blockId) ?? [];
      list.push(q);
      map.set(q.blockId, list);
    }
    return map;
  }, [section]);

  const blockQuestions = block ? questionsByBlock.get(block.id) ?? [] : [];

  const startNumber = useMemo(() => {
    if (!block) return 1;
    const firstId = questionsByBlock.get(block.id)?.[0]?.id;
    return section.questions.findIndex((q) => q.id === firstId) + 1;
  }, [block, questionsByBlock, section]);

  const locked = runtime.locked || state.submitted;
  const isLastBlock = state.currentBlockIndex >= section.blocks.length - 1;
  const isLastSection = sectionIndex >= test.sections.length - 1;
  const onInstructionScreen = !runtime.started;

  const goToSection = useCallback(
    (sectionId: string) => {
      dispatch({ type: "lock-section", sectionId: state.currentSectionId });
      dispatch({ type: "goto-section", sectionId });
    },
    [dispatch, state.currentSectionId],
  );

  const finish = useCallback(() => {
    dispatch({ type: "lock-section", sectionId: state.currentSectionId });
    dispatch({ type: "submit" });
    router.push(`/exam/${test.id}/result`);
  }, [dispatch, router, state.currentSectionId, test.id]);

  const resolvePending = useCallback(() => {
    if (!pending) return;
    if (pending.kind === "switch-section") goToSection(pending.sectionId);
    if (pending.kind === "next-section") goToSection(test.sections[sectionIndex + 1].id);
    if (pending.kind === "submit") finish();
    setPending(null);
  }, [pending, goToSection, finish, sectionIndex, test.sections]);

  const counts = summarise(section, state);
  const unfinished = counts.notAnswered + counts.notVisited;

  // The sub-tab reads "<Test> Instructions" on the briefing screen and the
  // test's own name once the questions are showing, as on the real portal.
  const subTabLabel = onInstructionScreen
    ? `${section.name.en} Instructions`
    : section.name.en;

  const saveAndNext = () => {
    if (onInstructionScreen) {
      dispatch({ type: "start-section", sectionId: section.id });
      return;
    }
    if (!isLastBlock) {
      dispatch({
        type: "goto-block",
        sectionId: section.id,
        blockIndex: state.currentBlockIndex + 1,
      });
      return;
    }
    if (!isLastSection) setPending({ kind: "next-section" });
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <RrbHeader />
      <ExamChrome
        title={title}
        subTabLabel={subTabLabel}
        onRequestSwitch={(sectionId) => setPending({ kind: "switch-section", sectionId })}
        onShowInstructions={() => setShowInstructions(true)}
      />

      <main
        className="exam-scale flex min-h-0 flex-1 flex-col"
        style={{ ["--exam-zoom" as string]: String(state.zoom) }}
      >
        {onInstructionScreen ? (
          <SectionInstructions section={section} />
        ) : runtime.phase === "study" ? (
          <StudyPhase section={section} />
        ) : (
          <>
            <QuestionPalette
              onJump={(blockIndex) => {
                if (blockIndex < 0) return;
                dispatch({ type: "goto-block", sectionId: section.id, blockIndex });
              }}
            />

            <div className="min-h-0 flex-1 overflow-y-auto">
              {locked && (
                <div className="border-b border-red-300 bg-red-50 px-4 py-2 text-[13px] font-semibold text-red-800">
                  This test is closed. Your answers have been saved.
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 p-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                {block?.stimulus && (
                  <div className="flex flex-col items-center gap-2 self-start xl:sticky xl:top-0">
                    {section.studyPhase && (
                      <div className="text-[15px] font-bold text-gray-900">Test Screen</div>
                    )}
                    <Stimulus
                      stimulus={block.stimulus}
                      lang={state.lang}
                      trackLabel="letter"
                    />
                  </div>
                )}

                <div className={block?.stimulus ? "" : "xl:col-span-2"}>
                  <AnswerGrid
                    questions={blockQuestions}
                    lang={state.lang}
                    startNumber={startNumber}
                    locked={locked}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Save & Next / Submit, as on the exam screen */}
      <div className="flex items-stretch border-t border-gray-300 bg-white">
        <div className="flex flex-1 items-center gap-2 px-3 py-3">
          {!onInstructionScreen && !locked && blockQuestions.length > 0 && (
            <button
              type="button"
              onClick={() => {
                for (const q of blockQuestions) dispatch({ type: "clear", qid: q.id });
              }}
              className="rounded border border-gray-400 bg-white px-4 py-2 text-[13px]
                         font-semibold text-gray-800 hover:bg-gray-100"
            >
              Clear
            </button>
          )}
          {!onInstructionScreen && state.currentBlockIndex > 0 && (
            <button
              type="button"
              onClick={() =>
                dispatch({
                  type: "goto-block",
                  sectionId: section.id,
                  blockIndex: state.currentBlockIndex - 1,
                })
              }
              className="rounded border border-gray-400 bg-white px-4 py-2 text-[13px]
                         font-semibold text-gray-800 hover:bg-gray-100"
            >
              Previous
            </button>
          )}

          <button
            type="button"
            onClick={saveAndNext}
            disabled={!onInstructionScreen && isLastBlock && isLastSection}
            className="ml-auto rounded bg-[#1d7fd7] px-8 py-2.5 text-[14px] font-semibold
                       text-white hover:bg-[#1668b0] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save &amp; Next
          </button>
        </div>

        <button
          type="button"
          onClick={() => setPending({ kind: "submit" })}
          className="w-[230px] shrink-0 bg-[#bcdcf3] text-[14px] font-semibold text-[#2b6ea8]
                     hover:bg-[#a5cfec]"
        >
          Submit
        </button>
      </div>

      <VersionBar />

      <ConfirmDialog
        open={state.paused && !state.submitted}
        title="Test paused"
        body={<p className="text-center">The timer is stopped. Resume when you are ready.</p>}
        confirmLabel="Resume"
        cancelLabel="Stay paused"
        onConfirm={() => dispatch({ type: "set-paused", paused: false })}
        onCancel={() => undefined}
      />

      <ConfirmDialog
        open={showInstructions}
        title="General Instructions"
        body={
          <div className="max-h-[50vh] space-y-2 overflow-y-auto text-left text-[13px]">
            {test.generalInstructions.map((line, i) => (
              <p key={i}>
                {line.en}
                {line.hi && (
                  <span className="mt-0.5 block text-gray-600" lang="hi">
                    {line.hi}
                  </span>
                )}
              </p>
            ))}
          </div>
        }
        confirmLabel="Close"
        cancelLabel="Back to test"
        onConfirm={() => setShowInstructions(false)}
        onCancel={() => setShowInstructions(false)}
      />

      <ConfirmDialog
        open={pending !== null}
        title={
          pending?.kind === "submit"
            ? "Are you sure you want to submit the test?"
            : "Are you sure you want to leave this test?"
        }
        body={
          <div className="space-y-1 text-center">
            <p>
              You cannot return to <strong>{section.name.en}</strong> once you leave it.
            </p>
            {unfinished > 0 && (
              <p className="font-semibold text-red-700">
                {unfinished} question{unfinished === 1 ? "" : "s"} still unanswered.
              </p>
            )}
          </div>
        }
        onConfirm={resolvePending}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
