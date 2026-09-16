"use client";

import { useExam } from "@/lib/exam-store";
import type { Section } from "@/lib/types";
import { BilingualPanel } from "./BilingualPanel";
import { Stimulus } from "./Stimulus";

/**
 * The per-section briefing shown before its clock starts: question count, time
 * limit, instructions and a worked example.
 */
export function SectionInstructions({
  section,
  onStart,
}: {
  section: Section;
  onStart: () => void;
}) {
  const { state } = useExam();

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <BilingualPanel
        render={(lang) => (
          <div className="space-y-3">
            <h2 className="text-[17px] font-bold text-gray-900">
              {section.name[lang]}
            </h2>

            <dl className="space-y-1 text-[14px] text-gray-800">
              <div className="flex gap-2">
                <dt className="font-semibold">
                  {lang === "hi" ? "प्रश्नों की संख्या:" : "No. of Questions:"}
                </dt>
                <dd>{section.questions.length}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-semibold">
                  {lang === "hi" ? "समय सीमा:" : "Time Limit:"}
                </dt>
                <dd>
                  {section.timeLimitMin} {lang === "hi" ? "मिनट" : "Minutes"}
                </dd>
              </div>
            </dl>

            <div>
              <h3 className="mb-1 text-[14px] font-bold text-gray-900">
                {lang === "hi" ? "निर्देश:-" : "Instructions:-"}
              </h3>
              <div className="space-y-2 text-[13px] leading-relaxed text-gray-800">
                {section.instructions.map((line, i) => (
                  <p key={i}>{line[lang]}</p>
                ))}
              </div>
            </div>

            {section.example && (
              <div className="space-y-2">
                {section.example.text.map((line, i) => (
                  <p key={i} className="text-[13px] leading-relaxed text-gray-800">
                    {line[lang]}
                  </p>
                ))}
                {section.example.stimulus && (
                  <div className="pt-1">
                    <Stimulus
                      stimulus={section.example.stimulus}
                      lang={lang}
                      trackLabel="code"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      />

      <div className="sticky bottom-0 mt-auto flex items-center justify-between gap-3 border-t border-gray-300 bg-gray-50 px-4 py-3">
        <p className="text-[12px] text-gray-600">
          The section timer starts as soon as you begin. It cannot be paused for
          extra time.
        </p>
        <button
          type="button"
          onClick={onStart}
          className="shrink-0 rounded bg-indigo-800 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-900"
        >
          {state.lang === "hi" ? "प्रारंभ करें" : "Begin Section"}
        </button>
      </div>
    </div>
  );
}
