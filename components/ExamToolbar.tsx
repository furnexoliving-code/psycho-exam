"use client";

import { useExam } from "@/lib/exam-store";
import { formatClock } from "@/lib/scoring";

/**
 * The strip under the banner: test name, screen zoom, the live section clock,
 * pause, language switch and the candidate chip.
 */
export function ExamToolbar({ onPauseToggle }: { onPauseToggle: () => void }) {
  const { test, state, dispatch } = useExam();
  const runtime = state.sections[state.currentSectionId];
  const section = test.sections.find((s) => s.id === state.currentSectionId);

  // During the study phase the countdown shown is the memorisation clock — but
  // only once the section has actually begun, since the instruction page sits
  // in front of it with no clock running yet.
  const showingStudy = runtime?.started === true && runtime.phase === "study";
  const secondsLeft = showingStudy ? runtime.studyRemainingSec : runtime?.remainingSec ?? 0;
  const urgent = !showingStudy && secondsLeft <= 60;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-300 bg-gray-50 px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-rrb-banner text-[10px] font-bold text-white">
          RRB
        </div>
        <span className="text-[13px] font-semibold text-gray-800">
          {test.displayName}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[13px] font-bold text-red-600">Screen Zoom</span>
        <button
          type="button"
          onClick={() => dispatch({ type: "zoom", delta: 0.1 })}
          className="exam-btn border-gray-400 bg-white hover:bg-gray-100"
          aria-label="Increase text size"
        >
          A+
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "zoom", delta: -0.1 })}
          className="exam-btn border-gray-400 bg-white hover:bg-gray-100"
          aria-label="Decrease text size"
        >
          A-
        </button>
      </div>

      <div
        className={`rounded border px-3 py-1 text-[13px] font-semibold ${
          urgent
            ? "animate-pulse border-red-400 bg-red-50 text-red-700"
            : "border-gray-400 bg-white text-gray-800"
        }`}
        role="timer"
        aria-live="off"
      >
        {showingStudy ? "Study Time Left " : "Time Left "}
        <span className="font-mono tabular-nums">{formatClock(secondsLeft)}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onPauseToggle}
          className="exam-btn border-gray-400 bg-white hover:bg-gray-100"
        >
          {state.paused ? "▶ Resume" : "❚❚ Pause"}
        </button>

        <label className="flex items-center gap-1 text-[12px] text-gray-700">
          <span className="hidden sm:inline">Language</span>
          <select
            value={state.lang}
            onChange={(e) =>
              dispatch({ type: "set-lang", lang: e.target.value as "en" | "hi" })
            }
            className="rounded border border-gray-400 bg-white px-2 py-1 text-[12px]"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
          </select>
        </label>

        <div className="flex items-center gap-2 rounded border border-gray-300 bg-white px-2 py-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-300 text-[11px] font-bold text-gray-700">
            {test.candidate.name.charAt(0)}
          </div>
          <div className="leading-tight">
            <div className="text-[11px] font-semibold text-gray-800">
              {test.candidate.name}
            </div>
            <div className="text-[10px] text-gray-500">
              Roll {test.candidate.rollNo}
            </div>
          </div>
        </div>
      </div>

      {section && (
        <div className="w-full text-[11px] text-gray-500">
          Section time limit: {section.timeLimitMin} min &nbsp;·&nbsp; Questions:{" "}
          {section.questions.length}
        </div>
      )}
    </div>
  );
}
