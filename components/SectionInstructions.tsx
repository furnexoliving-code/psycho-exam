"use client";

import { useExam } from "@/lib/exam-store";
import type { Section } from "@/lib/types";
import { Stimulus } from "./Stimulus";

/**
 * The per-test briefing, laid out the way the exam screen presents it: a
 * numbered item holding a centred serif heading, the question count and time
 * limit in both languages, then the instructions stacked English-over-Hindi.
 */
export function SectionInstructions({ section }: { section: Section }) {
  const { state, test } = useExam();
  const index = test.sections.findIndex((s) => s.id === section.id) + 1;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
      <div className="flex gap-3">
        <span className="pt-1 text-[15px] text-gray-900">{index}.</span>

        <div className="min-w-0 flex-1 font-serif text-gray-900">
          <h2 className="text-center text-[21px] font-bold">
            Test {index}: {section.name.en} / {section.name.hi}
          </h2>

          <dl className="mt-5 grid max-w-3xl grid-cols-1 gap-x-10 gap-y-1.5 sm:grid-cols-2">
            <Row
              label="No. of questions:"
              value={String(section.questions.length).padStart(2, "0")}
            />
            <Row
              label="प्रश्नों की संख्या:"
              value={String(section.questions.length).padStart(2, "0")}
            />
            <Row label="Time limit:" value={`${section.timeLimitMin} minutes`} />
            <Row label="समय सीमा:" value={`${section.timeLimitMin} मिनट`} />
          </dl>

          <p className="mt-4 text-[14px] italic">
            The number of questions and time limit of each test will vary in the actual
            test.
          </p>
          <p className="text-[14px] italic" lang="hi">
            प्रत्येक परीक्षण में प्रश्नों की संख्या तथा समय सीमा वास्तविक परीक्षण के समय अलग होगी।
          </p>

          <h3 className="mt-5 text-[17px] font-bold">Test instructions :</h3>

          <div className="mt-2 space-y-3 text-[15px] leading-relaxed">
            {section.instructions.map((line, i) => (
              <div key={i}>
                <p className="indent-8">{line.en}</p>
                {line.hi && (
                  <p className="mt-1 indent-8" lang="hi">
                    {line.hi}
                  </p>
                )}
              </div>
            ))}
          </div>

          {section.example && (
            <div className="mt-5 space-y-3 text-[15px] leading-relaxed">
              {section.example.text.map((line, i) => (
                <div key={i}>
                  <p className="indent-8">{line.en}</p>
                  {line.hi && (
                    <p className="mt-1 indent-8" lang="hi">
                      {line.hi}
                    </p>
                  )}
                </div>
              ))}
              {section.example.stimulus && (
                <div className="pt-2">
                  <Stimulus
                    stimulus={section.example.stimulus}
                    lang={state.lang}
                    trackLabel="code"
                  />
                </div>
              )}
            </div>
          )}

          <p className="mt-6 rounded border border-gray-300 bg-gray-50 px-3 py-2 text-[13px]">
            Click <strong>Save &amp; Next</strong> to begin. The timer starts as soon as the
            test opens.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-[15px]">
      <dt className="font-bold">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
