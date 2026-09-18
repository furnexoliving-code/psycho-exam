"use client";

import { useEffect, useRef } from "react";
import type { WatchQuestion } from "@/lib/wt/types";

/**
 * The right-hand column: every question stacked, laid out to match the
 * reference portal.
 *
 * Details taken from the reference rather than from habit:
 * - all ink is #494949, not black
 * - the question number sits in its own narrow gutter, vertically centred
 *   against the whole text block and much smaller than the body text
 * - the options row is indented LESS than the sentence above it, lining up
 *   with the number gutter, and the radios sit on a fixed pitch grid rather
 *   than flexing to label width
 * - the radios are the browser's default controls, and the label is the
 *   answer number, never A/B/C/D
 * - the Hindi line is simply the next line of the same paragraph
 * - a rule runs above the first question as well as between every pair
 *
 * The one thing deliberately NOT copied: the reference clips its question text
 * mid-word because the text column is wider than the panel. Text wraps here.
 */
export function QuestionList({
  questions,
  answers,
  currentIndex,
  showKeyHints,
  locked,
  onSelect,
  onFocusQuestion,
}: {
  questions: WatchQuestion[];
  answers: Record<string, number | null>;
  currentIndex: number;
  /** Show the 1-5 key badges beside the current question's options. */
  showKeyHints: boolean;
  locked: boolean;
  onSelect: (questionIndex: number, optionIndex: number) => void;
  onFocusQuestion: (index: number) => void;
}) {
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  // Keep the active question in view as the keyboard moves through the paper.
  useEffect(() => {
    refs.current[currentIndex]?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [currentIndex]);

  return (
    <ol className="border-t border-[#ececec]">
      {questions.map((question, qi) => {
        const current = qi === currentIndex;
        const chosen = answers[question.id];

        return (
          <li
            key={question.id}
            ref={(el) => {
              refs.current[qi] = el;
            }}
            className={`relative border-b border-[#ececec] py-5 pl-5 pr-6 transition-colors ${
              current ? "bg-[#eef8fb]" : "bg-white"
            }`}
            aria-current={current ? "step" : undefined}
          >
            {current && (
              <span
                className="absolute left-0 top-0 h-full w-[4px] bg-wt-pill"
                aria-hidden="true"
              />
            )}

            <div className="flex">
              {/* The number gutter: narrow, small, and centred against the
                  whole text block rather than aligned to its first line. */}
              <span className="flex w-[46px] shrink-0 items-center justify-start text-[13px] font-semibold text-[#494949]">
                Q. {qi + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[20px] leading-[1.45] text-[#494949]">
                  {question.prompt.en}
                </p>
                <p className="text-[20px] leading-[1.45] text-[#494949]" lang="hi">
                  {question.prompt.hi}
                </p>
              </div>
            </div>

            {/* Options hang to the LEFT of the sentence, lining up with the
                number gutter, on a fixed pitch grid. */}
            <div
              className="mt-3 grid gap-y-2"
              style={{ gridTemplateColumns: "repeat(5, 92px)" }}
            >
              {question.options.map((option, oi) => {
                const selected = chosen === option;
                const id = `${question.id}-opt-${oi}`;
                return (
                  <span key={id} className="flex items-center gap-2">
                    <input
                      id={id}
                      type="radio"
                      name={question.id}
                      checked={selected}
                      disabled={locked}
                      onChange={() => onSelect(qi, oi)}
                      onFocus={() => onFocusQuestion(qi)}
                      className="h-[13px] w-[13px] shrink-0 cursor-pointer"
                    />
                    <label
                      htmlFor={id}
                      className={`cursor-pointer text-[20px] text-[#494949] ${
                        selected ? "font-semibold" : ""
                      }`}
                    >
                      {option}
                    </label>
                    {current && showKeyHints && (
                      <kbd
                        className="rounded border border-gray-400 bg-white px-1 text-[10px]
                                   font-semibold text-gray-500"
                        aria-hidden="true"
                      >
                        {oi + 1}
                      </kbd>
                    )}
                  </span>
                );
              })}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
