"use client";

import { useEffect, useRef } from "react";
import type { WatchQuestion } from "@/lib/wt/types";

/**
 * The right-hand column: every question stacked, the way the portal shows
 * them. The current question is the one the keyboard acts on, so it carries a
 * visible marker — without it, keyboard-only navigation is guesswork.
 */
export function QuestionList({
  questions,
  answers,
  currentIndex,
  keyboardOnly,
  locked,
  onSelect,
  onFocusQuestion,
}: {
  questions: WatchQuestion[];
  answers: Record<string, number | null>;
  currentIndex: number;
  keyboardOnly: boolean;
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
    <ol className="divide-y divide-gray-200">
      {questions.map((question, qi) => {
        const current = qi === currentIndex;
        const chosen = answers[question.id];

        return (
          <li
            key={question.id}
            ref={(el) => {
              refs.current[qi] = el;
            }}
            className={`relative px-5 py-5 transition-colors ${
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

            <div className="flex gap-4">
              <span className="w-[42px] shrink-0 pt-1 text-[12px] font-bold text-gray-500">
                Q. {qi + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[16px] leading-relaxed text-gray-900">
                  {question.prompt.en}
                </p>
                <p className="mt-1 text-[16px] leading-relaxed text-gray-900" lang="hi">
                  {question.prompt.hi}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-2">
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
                          // Keyboard-only mode answers through the page-level
                          // key handler; the input stays in the DOM so screen
                          // readers still announce the group correctly.
                          onChange={() => {
                            if (keyboardOnly) return;
                            onSelect(qi, oi);
                          }}
                          onFocus={() => onFocusQuestion(qi)}
                          tabIndex={keyboardOnly ? -1 : 0}
                          className="h-[18px] w-[18px] accent-wt-pill"
                        />
                        <label
                          htmlFor={id}
                          className={`text-[17px] ${
                            selected ? "font-bold text-gray-900" : "text-gray-800"
                          }`}
                        >
                          {option}
                        </label>
                        {current && keyboardOnly && (
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
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
