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
 * The question column is deliberately WIDER than the panel that holds it, so a
 * question runs off the right edge and has to be brought into view with the
 * horizontal scrollbar. The reference portal does exactly this — its text
 * column is about 1060px inside a 710px panel, which is why its sentences break
 * mid-word at "...up to South-We". Asked for, so reproduced: WIDTH_RATIO below
 * is that same 1.49.
 */

/** Content width as a multiple of the panel width, matching the reference. */
const WIDTH_RATIO = 1.49;
export function QuestionList({
  questions,
  answers,
  currentIndex,
  locked,
  container,
  scrollToken,
  overflow = true,
  onSelect,
}: {
  questions: WatchQuestion[];
  answers: Record<string, number | null>;
  currentIndex: number;
  locked: boolean;
  /** The scrolling panel, so navigation can move one axis only. */
  container: React.RefObject<HTMLElement | null>;
  /**
   * Bumped by the parent ONLY when the keyboard moves between questions.
   * Scrolling is deliberately not tied to currentIndex: clicking an option
   * also sets the current question, and a scroll fired mid-click pulled the
   * radio out from under the pointer so the click never landed — which is why
   * selecting an option used to take two clicks.
   */
  scrollToken: number;
  /** Run the column past the panel's right edge, as the reference does. */
  overflow?: boolean;
  onSelect: (questionIndex: number, optionIndex: number) => void;
}) {
  const refs = useRef<(HTMLLIElement | null)[]>([]);
  const indexRef = useRef(currentIndex);
  indexRef.current = currentIndex;

  // Keep the active question in view as the keyboard moves through the paper.
  //
  // scrollIntoView is not used: a question is wider than the panel, so even
  // `inline: "nearest"` nudges the column sideways and undoes wherever the
  // candidate had scrolled to horizontally. Setting scrollTop by hand moves
  // the vertical axis and leaves scrollLeft exactly where it was.
  useEffect(() => {
    if (scrollToken === 0) return;

    const el = refs.current[indexRef.current];
    const panel = container.current;
    if (!el || !panel) return;

    const item = el.getBoundingClientRect();
    const view = panel.getBoundingClientRect();
    const delta = item.top - view.top - (view.height - item.height) / 2;

    panel.scrollTo({ top: panel.scrollTop + delta, behavior: "smooth" });
  }, [scrollToken, container]);

  return (
    <ol
      className="border-t border-[#ececec]"
      style={{ width: overflow ? `${WIDTH_RATIO * 100}%` : "100%" }}
    >
      {questions.map((question, qi) => {
        const current = qi === currentIndex;
        const chosen = answers[question.id];

        return (
          <li
            key={question.id}
            ref={(el) => {
              refs.current[qi] = el;
            }}
            className="relative border-b border-[#ececec] bg-white py-5 pl-5 pr-6"
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
              <span className="flex w-[46px] shrink-0 items-center justify-start text-[0.8125em] font-semibold text-[#494949]">
                Q. {qi + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[1.25em] leading-[1.45] text-[#494949]">
                  {question.prompt.en}
                </p>
                <p className="text-[1.25em] leading-[1.45] text-[#494949]" lang="hi">
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
                      className="h-[13px] w-[13px] shrink-0 cursor-pointer"
                    />
                    <label
                      htmlFor={id}
                      className={`cursor-pointer text-[1.25em] text-[#494949] ${
                        selected ? "font-semibold" : ""
                      }`}
                    >
                      {option}
                    </label>
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
