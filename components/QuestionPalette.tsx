"use client";

import { useExam } from "@/lib/exam-store";
import { statusOf, type QuestionStatus } from "@/lib/types";
import { LEGEND_ORDER, PaletteLegend, STATUS_STYLE } from "./PaletteLegend";

/**
 * The question palette. The exam screen puts it at the top-left of the test
 * area — a legend with live counts, then the numbered cells — so that is where
 * it sits here rather than in a right-hand sidebar.
 */
export function QuestionPalette({ onJump }: { onJump: (blockIndex: number) => void }) {
  const { test, state } = useExam();
  const section = test.sections.find((s) => s.id === state.currentSectionId);
  if (!section) return null;

  const counts: Record<QuestionStatus, number> = {
    answered: 0,
    "not-answered": 0,
    "not-visited": 0,
  };
  for (const q of section.questions) counts[statusOf(state.answers[q.id])] += 1;

  const blockIndexOf = (blockId: string) =>
    section.blocks.findIndex((b) => b.id === blockId);

  return (
    <div className="border-b border-gray-300 bg-[#f4f6f8] px-3 py-2">
      <PaletteLegend counts={counts} compact />

      <div className="mt-2 flex flex-wrap gap-1.5">
        {section.questions.map((q, i) => {
          const status = statusOf(state.answers[q.id]);
          const style = STATUS_STYLE[status];
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onJump(blockIndexOf(q.blockId))}
              className={`flex h-8 w-8 items-center justify-center text-[12px] font-bold
                          transition-transform hover:scale-110 ${style.shape}`}
              style={{ background: style.bg, color: style.fg }}
              title={style.label}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { LEGEND_ORDER };
