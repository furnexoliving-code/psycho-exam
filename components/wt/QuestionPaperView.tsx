"use client";

import { useRef } from "react";
import type { WatchPaper } from "@/lib/wt/types";
import { ScrollRail } from "./ScrollRail";
import { WatchTableDiagram } from "./WatchTableDiagram";

/**
 * The whole paper on one page, behind the banner's "Question Paper" button.
 *
 * Read-only on purpose: it is for reading the paper end to end, not for
 * answering. Answers stay on the exam screen so there is one place a mark can
 * come from.
 */
export function QuestionPaperView({
  paper,
  answers,
  open,
  onClose,
}: {
  paper: WatchPaper;
  answers: Record<string, number | null>;
  open: boolean;
  onClose: () => void;
}) {
  const body = useRef<HTMLDivElement | null>(null);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Question paper"
    >
      <div className="flex h-full max-h-[92vh] w-full max-w-5xl flex-col rounded bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-gray-300 px-5 py-3">
          <h2 className="text-[16px] font-bold text-[#494949]">Question Paper</h2>
          <span className="text-[12px] text-gray-500">
            {paper.questions.length} questions · {paper.timeLimitMin} minutes · reading only
          </span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded bg-wt-submit px-5 py-1.5 text-[13px] font-semibold text-white hover:opacity-90"
          >
            Close
          </button>
        </div>

        <div className="relative min-h-0 flex-1">
          <div ref={body} className="wt-scroll-host h-full px-6 py-5 pr-[15px]">
          {paper.tables.map((table, ti) => (
            <section key={table.label} className="mb-8">
              <h3 className="mb-2 text-[13px] font-bold text-[#494949]">{table.label}</h3>

              <div className="flex flex-col gap-6 lg:flex-row">
                <div className="shrink-0 lg:w-[330px]">
                  {paper.imageUrl && ti === 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={paper.imageUrl} alt="Watch table diagram" className="w-full" />
                  ) : (
                    <WatchTableDiagram table={table} />
                  )}
                </div>

                <ol className="min-w-0 flex-1 border-t border-[#ececec]">
                  {paper.questions
                    .map((q, index) => ({ q, index }))
                    .filter(({ q }) => q.tableIndex === ti)
                    .map(({ q, index }) => {
                      const given = answers[q.id];
                      return (
                        <li key={q.id} className="border-b border-[#ececec] py-3">
                          <div className="flex gap-3">
                            <span className="w-[42px] shrink-0 text-[12px] font-semibold text-[#494949]">
                              Q. {index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[15px] leading-relaxed text-[#494949]">
                                {q.prompt.en}
                              </p>
                              <p className="text-[15px] leading-relaxed text-[#494949]" lang="hi">
                                {q.prompt.hi}
                              </p>
                              <p className="mt-1.5 flex flex-wrap gap-x-6 text-[15px] text-[#494949]">
                                {q.options.map((option) => (
                                  <span
                                    key={option}
                                    className={
                                      given === option
                                        ? "font-bold text-wt-submit"
                                        : undefined
                                    }
                                  >
                                    {given === option ? "◉" : "○"} {option}
                                  </span>
                                ))}
                              </p>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                </ol>
              </div>
            </section>
          ))}
          </div>
          <ScrollRail target={body} axis="vertical" />
        </div>

        <div className="border-t border-gray-300 px-5 py-2 text-[12px] text-gray-500">
          Your saved answers are marked. Change them on the test screen.
        </div>
      </div>
    </div>
  );
}
