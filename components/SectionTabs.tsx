"use client";

import { useExam } from "@/lib/exam-store";

/**
 * The teal strip of section tabs. Switching away from an unfinished section is
 * allowed but confirmed first, matching the real portal's skip warning.
 */
export function SectionTabs({
  onRequestSwitch,
}: {
  onRequestSwitch: (sectionId: string) => void;
}) {
  const { test, state } = useExam();

  return (
    <div className="flex w-full items-stretch overflow-x-auto bg-rrb-teal">
      {test.sections.map((section, index) => {
        const active = section.id === state.currentSectionId;
        const runtime = state.sections[section.id];

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => !active && onRequestSwitch(section.id)}
            className={`flex shrink-0 items-center gap-2 whitespace-nowrap border-r border-white/30 px-4 py-2 text-[12px] font-semibold transition-colors ${
              active
                ? "bg-rrb-tealDark text-white"
                : "text-white/85 hover:bg-white/10 hover:text-white"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <span>{state.lang === "hi" ? section.name.hi : section.name.en}</span>
            {runtime?.locked && (
              <span
                className="rounded bg-white/25 px-1 text-[9px] uppercase"
                title="This section is closed"
              >
                done
              </span>
            )}
            <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-white/90 text-[9px] font-bold text-rrb-tealDark">
              {index + 1}
            </span>
          </button>
        );
      })}
    </div>
  );
}
