"use client";

import type { WatchPaper } from "@/lib/wt/types";
import { WatchTableDiagram } from "./WatchTableDiagram";

/**
 * The instruction tab, shown before the test in the portal's two-column
 * English | Hindi layout.
 */
export function Instructions({ paper }: { paper: WatchPaper }) {
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

    </div>
  );
}
