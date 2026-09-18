"use client";

import type { WatchPaper } from "@/lib/wt/types";
import { KEY_HELP } from "@/lib/wt/useKeyboardOnly";
import { WatchTableDiagram } from "./WatchTableDiagram";

/**
 * The instruction tab, shown before the test in the portal's two-column
 * English | Hindi layout.
 */
export function Instructions({
  paper,
  onBegin,
}: {
  paper: WatchPaper;
  onBegin: () => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="grid grid-cols-1 divide-x divide-gray-200 xl:grid-cols-2">
        {(["en", "hi"] as const).map((lang) => (
          <div key={lang} className="px-6 py-5" lang={lang}>
            <h2 className="text-[19px] font-bold text-gray-900">{paper.title}</h2>

            <dl className="mt-3 space-y-1 text-[15px] text-gray-900">
              <div className="flex gap-2">
                <dt className="font-bold">
                  {lang === "en" ? "No. of Questions:" : "प्रश्नों की संख्या:"}
                </dt>
                <dd>{paper.questions.length}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-bold">
                  {lang === "en" ? "Time Limit:" : "समय सीमा:"}
                </dt>
                <dd>
                  {paper.timeLimitMin} {lang === "en" ? "Minutes" : "मिनट"}
                </dd>
              </div>
            </dl>

            <h3 className="mt-4 text-[15px] font-bold text-gray-900">
              {lang === "en" ? "Instructions:-" : "निर्देश:-"}
            </h3>
            <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-gray-900">
              {paper.instructions.map((line, i) => (
                <p key={i}>{line[lang]}</p>
              ))}
            </div>

            <h3 className="mt-5 text-[15px] font-bold text-gray-900">
              {lang === "en"
                ? "Now look at the example given below :-"
                : "अब नीचे दिए गए उदाहरण को देखें:-"}
            </h3>
            {paper.example.text.map((line, i) => (
              <p key={i} className="mt-2 text-[15px] leading-relaxed text-gray-900">
                {line[lang]}
              </p>
            ))}

            <div className="mt-3 flex justify-center">
              <WatchTableDiagram table={paper.example.table} boxedValues />
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 bg-[#f7fafc] px-6 py-5">
        <h3 className="text-[14px] font-bold text-gray-900">
          Keys you will use <span className="font-normal text-gray-600" lang="hi">— कुंजियाँ</span>
        </h3>
        <div className="mt-2 grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
          {KEY_HELP.map((row) => (
            <div key={row.keys} className="flex items-baseline gap-3 text-[13px]">
              <kbd className="shrink-0 rounded border border-gray-400 bg-white px-2 py-0.5 font-semibold text-gray-800">
                {row.keys}
              </kbd>
              <span className="text-gray-800">
                {row.action}
                <span className="ml-2 text-gray-500" lang="hi">
                  {row.actionHi}
                </span>
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-4">
          <button
            type="button"
            data-allow-mouse="true"
            onClick={onBegin}
            className="rounded bg-wt-submit px-8 py-2.5 text-[14px] font-semibold text-white hover:opacity-90"
          >
            Skip Instruction
          </button>
          <p className="text-[12px] text-gray-600">
            The clock is already running — it covers the whole test.
          </p>
        </div>
      </div>
    </div>
  );
}
