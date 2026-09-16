"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useExam } from "@/lib/exam-store";
import { summarise } from "@/lib/scoring";
import type { Question } from "@/lib/types";
import { AnswerGrid } from "./AnswerGrid";
import { BilingualPanel } from "./BilingualPanel";
import { ConfirmDialog } from "./ConfirmDialog";
import { ExamBanner } from "./ExamBanner";
import { ExamToolbar } from "./ExamToolbar";
import { QuestionPalette } from "./QuestionPalette";
import { SectionInstructions } from "./SectionInstructions";
import { SectionTabs } from "./SectionTabs";
import { StudyPhase } from "./StudyPhase";
import { Stimulus } from "./Stimulus";

type Pending =
  | { kind: "switch-section"; sectionId: string }
  | { kind: "next-section" }
  | { kind: "submit" }
  | null;

export function ExamRunner() {
  const router = useRouter();
  const { test, state, dispatch } = useExam();
  const [pending, setPending] = useState<Pending>(null);

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

  // Continuous numbering across blocks, so the palette and the sheet agree.
  const startNumber = useMemo(() => {
    if (!block) return 1;
    const firstId = questionsByBlock.get(block.id)?.[0]?.id;
    return section.questions.findIndex((q) => q.id === firstId) + 1;
  }, [block, questionsByBlock, section]);

  const locked = runtime.locked || state.submitted;
  const isLastBlock = state.currentBlockIndex >= section.blocks.length - 1;
  const isLastSection = sectionIndex >= test.sections.length - 1;

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
    if (pending.kind === "next-section") {
      goToSection(test.sections[sectionIndex + 1].id);
    }
    if (pending.kind === "submit") finish();
    setPending(null);
  }, [pending, goToSection, finish, sectionIndex, test.sections]);

  const counts = summarise(section, state);
  const unfinished = counts.notAnswered + counts.notVisited + counts.marked;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <ExamBanner />
      <ExamToolbar
        onPauseToggle={() => dispatch({ type: "set-paused", paused: !state.paused })}
      />
      <SectionTabs
        onRequestSwitch={(sectionId) => setPending({ kind: "switch-section", sectionId })}
      />

      <div
        className="exam-scale flex min-h-0 flex-1 flex-col lg:flex-row"
        style={{ ["--exam-zoom" as string]: String(state.zoom) }}
      >
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {!runtime.started ? (
            <SectionInstructions
              section={section}
              onStart={() => dispatch({ type: "start-section", sectionId: section.id })}
            />
          ) : runtime.phase === "study" ? (
            <StudyPhase section={section} />
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {locked && (
                  <div className="border-b border-red-300 bg-red-50 px-4 py-2 text-[13px] font-semibold text-red-800">
                    This section is closed. Your answers have been saved and can no
                    longer be changed.
                  </div>
                )}

                {block?.title && (
                  <div className="border-b border-gray-300 bg-gray-100 px-4 py-1.5 text-[12px] font-bold text-gray-700">
                    {block.title[state.lang]}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  {block?.stimulus && (
                    // Sticky so the map, grid or figure row stays on screen
                    // while the candidate scrolls the answer sheet beside it.
                    <div className="flex flex-col items-center gap-2 self-start xl:sticky xl:top-0">
                      {section.studyPhase && (
                        <div className="text-[15px] font-bold text-gray-900">
                          Test Page
                        </div>
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

              <div className="flex flex-wrap items-center gap-2 border-t border-gray-300 bg-gray-50 px-3 py-2">
                <button
                  type="button"
                  disabled={locked || blockQuestions.length === 0}
                  onClick={() => {
                    for (const q of blockQuestions) {
                      dispatch({ type: "set-review", qid: q.id, value: true });
                    }
                    if (!isLastBlock) {
                      dispatch({
                        type: "goto-block",
                        sectionId: section.id,
                        blockIndex: state.currentBlockIndex + 1,
                      });
                    }
                  }}
                  className="exam-btn border-purple-600 bg-purple-600 text-white hover:bg-purple-700"
                >
                  Mark for Review &amp; Next
                </button>

                <button
                  type="button"
                  disabled={locked || blockQuestions.length === 0}
                  onClick={() => {
                    for (const q of blockQuestions) dispatch({ type: "clear", qid: q.id });
                  }}
                  className="exam-btn border-gray-400 bg-white text-gray-800 hover:bg-gray-100"
                >
                  Clear Response
                </button>

                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={state.currentBlockIndex === 0}
                    onClick={() =>
                      dispatch({
                        type: "goto-block",
                        sectionId: section.id,
                        blockIndex: state.currentBlockIndex - 1,
                      })
                    }
                    className="exam-btn border-gray-400 bg-white text-gray-800 hover:bg-gray-100"
                  >
                    ‹ Previous
                  </button>

                  {!isLastBlock ? (
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({
                          type: "goto-block",
                          sectionId: section.id,
                          blockIndex: state.currentBlockIndex + 1,
                        })
                      }
                      className="exam-btn border-rrb-banner bg-rrb-banner text-white hover:bg-rrb-bannerDark"
                    >
                      Save &amp; Next ›
                    </button>
                  ) : isLastSection ? (
                    <button
                      type="button"
                      onClick={() => setPending({ kind: "submit" })}
                      className="exam-btn border-green-700 bg-green-700 text-white hover:bg-green-800"
                    >
                      Submit Test
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPending({ kind: "next-section" })}
                      className="exam-btn border-rrb-banner bg-rrb-banner text-white hover:bg-rrb-bannerDark"
                    >
                      Next Section ›
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </main>

        <QuestionPalette
          onJump={(blockIndex) => {
            if (blockIndex < 0) return;
            dispatch({ type: "goto-block", sectionId: section.id, blockIndex });
          }}
        />
      </div>

      <ConfirmDialog
        open={state.paused && !state.submitted}
        title="Test paused"
        body={
          <p className="text-center">
            The section timer is stopped. Resume when you are ready to continue.
          </p>
        }
        confirmLabel="Resume test"
        cancelLabel="Stay paused"
        onConfirm={() => dispatch({ type: "set-paused", paused: false })}
        onCancel={() => undefined}
      />

      <ConfirmDialog
        open={pending !== null}
        title={
          pending?.kind === "submit"
            ? "Are you sure you want to submit the test?"
            : "Are you sure you want to skip this?"
        }
        body={
          <div className="space-y-1 text-center">
            <p>
              You cannot return to <strong>{section.name.en}</strong> once you leave
              it.
            </p>
            {unfinished > 0 && (
              <p className="font-semibold text-red-700">
                {unfinished} question{unfinished === 1 ? "" : "s"} still unanswered
                or marked for review.
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
