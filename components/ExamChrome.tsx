"use client";

import { useExam } from "@/lib/exam-store";
import { CandidatePanel } from "./CandidatePanel";

/** Countdown in MM:SS, the format the exam screen uses. */
export function examClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

const InfoDot = () => (
  <span
    className="flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full
               bg-[#1d7fd7] text-[10px] font-bold italic text-white"
    aria-hidden="true"
  >
    i
  </span>
);

/**
 * The exam screen's own chrome: the black title bar, the horizontally
 * scrolling strip of test tabs, the Sections sub-strip and the countdown.
 */
export function ExamChrome({
  title,
  onRequestSwitch,
  onShowInstructions,
  subTabLabel,
}: {
  title: string;
  onRequestSwitch: (sectionId: string) => void;
  onShowInstructions: () => void;
  subTabLabel: string;
}) {
  const { test, state } = useExam();
  const runtime = state.sections[state.currentSectionId];

  const showingStudy = runtime?.started === true && runtime.phase === "study";
  const secondsLeft = showingStudy
    ? runtime.studyRemainingSec
    : runtime?.remainingSec ?? 0;

  return (
    <>
      <div className="flex items-center justify-between bg-black px-3 py-1.5">
        <span className="text-[13px] font-semibold text-[#ffd24d]">{title}</span>
        <button
          type="button"
          onClick={onShowInstructions}
          className="flex items-center gap-1.5 rounded bg-[#1b1b1b] px-2 py-1 text-[12px]
                     font-semibold text-white hover:bg-[#2b2b2b]"
        >
          <InfoDot />
          Instructions
        </button>
      </div>

      <div className="flex items-stretch border-b border-gray-300 bg-white">
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Test tabs */}
          <div className="flex items-center gap-1 px-1 py-2">
            <Arrow dir="left" />
            <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
              {test.sections.map((section) => {
                const active = section.id === state.currentSectionId;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => !active && onRequestSwitch(section.id)}
                    className={`relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded
                                border px-3 py-1.5 text-[12px] font-semibold ${
                      active
                        ? "border-[#1d7fd7] bg-[#1d7fd7] text-white"
                        : "border-gray-400 bg-white text-gray-800 hover:bg-gray-50"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="max-w-[170px] truncate">
                      {state.lang === "hi" ? section.name.hi : section.name.en}
                    </span>
                    <InfoDot />
                    {active && (
                      // The little pointer the active tab drops onto the row below.
                      <span className="absolute -bottom-[7px] left-1/2 h-0 w-0 -translate-x-1/2
                                       border-x-[7px] border-t-[7px] border-x-transparent
                                       border-t-[#1d7fd7]" />
                    )}
                  </button>
                );
              })}
            </div>
            <Arrow dir="right" />
          </div>

          {/* Sections label + countdown */}
          <div className="flex items-center justify-between px-3 pb-1">
            <span className="text-[13px] font-semibold text-gray-800">Sections</span>
            <span className="text-[14px] font-semibold text-gray-900">
              {showingStudy ? "Study Time Left : " : "Time Left : "}
              <span className="font-mono tabular-nums">{examClock(secondsLeft)}</span>
            </span>
          </div>

          {/* Sub-tab strip */}
          <div className="flex items-center gap-1 border-t border-gray-200 px-1 py-2">
            <Arrow dir="left" />
            <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
              <span
                className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded
                           border border-[#1d7fd7] bg-[#1d7fd7] px-3 py-1.5 text-[12px]
                           font-semibold text-white"
              >
                {subTabLabel}
                <InfoDot />
              </span>
            </div>
            <Arrow dir="right" />
          </div>
        </div>

        <CandidatePanel name={test.candidate.name} />
      </div>
    </>
  );
}

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <span
      className="flex h-6 w-5 shrink-0 items-center justify-center text-[13px] text-gray-500"
      aria-hidden="true"
    >
      {dir === "left" ? "◀" : "▶"}
    </span>
  );
}
