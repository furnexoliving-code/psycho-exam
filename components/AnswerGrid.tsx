"use client";

import { useEffect } from "react";
import { useExam } from "@/lib/exam-store";
import type { Lang, Question } from "@/lib/types";

/**
 * The answer sheet for one block: a numbered row per question with its choice
 * keys laid out across. Choices carrying labels (the personality test's Likert
 * statements) stack vertically instead, since they do not fit on one line.
 */
export function AnswerGrid({
  questions,
  lang,
  startNumber,
  locked,
}: {
  questions: Question[];
  lang: Lang;
  /** 1-based index of the first question, for continuous numbering. */
  startNumber: number;
  locked: boolean;
}) {
  const { state, dispatch } = useExam();

  // Arriving at a block marks its questions visited, which is what turns the
  // palette from grey to red for anything left blank.
  useEffect(() => {
    for (const q of questions) {
      dispatch({ type: "visit", qid: q.id });
    }
  }, [questions, dispatch]);

  const labelled = questions.some((q) => q.choices.some((c) => c.label));

  return (
    <div className="divide-y divide-gray-200 border border-gray-300 bg-white">
      {questions.map((q, i) => {
        const answer = state.answers[q.id];
        const number = startNumber + i;

        return (
          <div
            key={q.id}
            className={`px-3 py-2.5 ${labelled ? "space-y-2" : "sm:flex sm:items-center sm:gap-4"}`}
          >
            <div className="flex min-w-0 items-baseline gap-2 sm:w-[46%]">
              <span className="shrink-0 text-[12px] font-semibold text-gray-500">
                Q.{number}
              </span>
              <span className="text-[15px] font-semibold text-gray-900">
                {q.prompt[lang]}
              </span>
            </div>

            <div
              className={
                labelled
                  ? "space-y-1.5 pl-8"
                  : "mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 sm:mt-0 sm:flex-1"
              }
            >
              {q.choices.map((choice) => {
                const id = `${q.id}-${choice.key}`;
                return (
                  <label
                    key={choice.key}
                    htmlFor={id}
                    className={`flex cursor-pointer items-center gap-1.5 text-[14px] text-gray-800 ${
                      locked ? "cursor-not-allowed opacity-60" : "hover:text-rrb-banner"
                    }`}
                  >
                    <input
                      id={id}
                      type="radio"
                      name={q.id}
                      value={choice.key}
                      disabled={locked}
                      checked={answer?.choice === choice.key}
                      onChange={() =>
                        dispatch({ type: "select", qid: q.id, choice: choice.key })
                      }
                      className="h-4 w-4 accent-rrb-banner"
                    />
                    <span className="font-medium">{choice.key}</span>
                    {choice.label && (
                      <span className="font-normal">{choice.label[lang]}</span>
                    )}
                  </label>
                );
              })}

              {!locked && answer?.choice && (
                <button
                  type="button"
                  onClick={() => dispatch({ type: "clear", qid: q.id })}
                  className="text-[11px] font-medium text-red-600 underline underline-offset-2 hover:text-red-700"
                >
                  clear
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
