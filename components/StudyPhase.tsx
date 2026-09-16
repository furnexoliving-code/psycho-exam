"use client";

import { useExam } from "@/lib/exam-store";
import { formatClock } from "@/lib/scoring";
import type { Section } from "@/lib/types";
import { Stimulus } from "./Stimulus";

/**
 * The memory test's first half: the study page is displayed under its own
 * countdown and cannot be returned to once the test page opens.
 */
export function StudyPhase({ section }: { section: Section }) {
  const { state, dispatch } = useExam();
  const runtime = state.sections[section.id];
  if (!section.studyPhase || !runtime) return null;

  return (
    <div className="flex flex-1 flex-col items-center gap-4 overflow-y-auto px-4 py-6">
      <div className="rounded border border-amber-300 bg-amber-50 px-4 py-2 text-center">
        <div className="text-[13px] font-semibold text-amber-900">
          Study Page — memorise the location of each station
        </div>
        <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-amber-900">
          {formatClock(runtime.studyRemainingSec)}
        </div>
        <div className="mt-1 text-[11px] text-amber-800">
          The test page opens automatically when this timer ends.
        </div>
      </div>

      <div className="text-center text-lg font-bold text-gray-900">Study Page</div>

      <Stimulus stimulus={section.studyPhase.stimulus} lang={state.lang} trackLabel="code" />

      <button
        type="button"
        onClick={() => dispatch({ type: "end-study", sectionId: section.id })}
        className="exam-btn border-rrb-banner bg-rrb-banner text-white hover:bg-rrb-bannerDark"
      >
        I have memorised it — go to Test Page
      </button>
    </div>
  );
}
