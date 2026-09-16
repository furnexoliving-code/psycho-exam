"use client";

import { useExam } from "@/lib/exam-store";
import { statusOf } from "@/lib/types";
import { STATUS_STYLE, PaletteLegend } from "./PaletteLegend";

/**
 * The right-hand palette. Clicking a number jumps to the block containing that
 * question, since questions are presented a block at a time.
 */
export function QuestionPalette({ onJump }: { onJump: (blockIndex: number) => void }) {
  const { test, state } = useExam();
  const section = test.sections.find((s) => s.id === state.currentSectionId);
  if (!section) return null;

  const blockIndexOf = (blockId: string) =>
    section.blocks.findIndex((b) => b.id === blockId);

  return (
    <aside className="flex w-full flex-col border-l border-gray-300 bg-gray-50 lg:w-[280px] lg:shrink-0">
      <div className="border-b border-gray-300 bg-gray-100 px-3 py-2">
        <PaletteLegend compact />
      </div>

      <div className="border-b border-gray-300 bg-rrb-banner px-3 py-1.5 text-[12px] font-semibold text-white">
        {state.lang === "hi" ? section.name.hi : section.name.en}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Choose a Question
        </p>
        <div className="grid grid-cols-6 gap-1.5">
          {section.questions.map((q, i) => {
            const status = statusOf(state.answers[q.id]);
            const style = STATUS_STYLE[status];
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => onJump(blockIndexOf(q.blockId))}
                className={`palette-btn ${style.shape}`}
                style={{
                  background: style.bg,
                  color: status === "not-visited" ? "#374151" : "#fff",
                }}
                title={style.label}
              >
                {i + 1}
                {status === "answered-marked" && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-green-500 text-[7px] font-bold text-white">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
