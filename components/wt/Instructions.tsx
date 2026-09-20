"use client";

import { useRef } from "react";
import type { InstructionBlock, WatchPaper } from "@/lib/wt/types";
import { ScrollRail } from "./ScrollRail";
import { WatchTableDiagram } from "./WatchTableDiagram";

/**
 * The instruction content, in the portal's two-column English | Hindi layout.
 *
 * Shared by the instruction screen and by the Instructions button in the
 * banner, which reopens it as a dialog once the test has started. There is one
 * copy of this text so the two can never drift apart.
 */
export function InstructionsBody({ paper }: { paper: WatchPaper }) {
  return (
    <div className="grid grid-cols-1 divide-x divide-gray-200 xl:grid-cols-2">
      {(["en", "hi"] as const).map((lang) => (
        <div key={lang} className="px-6 py-5" lang={lang}>
          <h2 className="text-[19px] font-bold text-[#494949]">{paper.title}</h2>

          <dl className="mt-3 space-y-1 text-[15px] text-[#494949]">
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

          <h3 className="mt-4 text-[15px] font-bold text-[#494949]">
            {lang === "en" ? "Instructions:-" : "निर्देश:-"}
          </h3>
          <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-[#494949]">
            {paper.instructions.map((line, i) => (
              <Block key={i} block={line} lang={lang} />
            ))}
          </div>

          <h3 className="mt-5 text-[15px] font-bold text-[#494949]">
            {lang === "en"
              ? "Now look at the example given below :-"
              : "अब नीचे दिए गए उदाहरण को देखें:-"}
          </h3>
          {paper.example.text.map((line, i) => (
            <div key={i} className="mt-2 text-[15px] leading-relaxed text-[#494949]">
              <Block block={line} lang={lang} />
            </div>
          ))}

          {/* The drawn compass is the sample paper's own example. A paper
              with its own uploaded picture shows that instead — the drawn
              one would show letters and numbers the candidate never sees. */}
          {!paper.imageUrl && (
            <div className="mt-3 flex justify-center">
              <WatchTableDiagram table={paper.example.table} boxedValues />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** The full-screen instruction phase, before the test opens. */
export function Instructions({ paper }: { paper: WatchPaper }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <InstructionsBody paper={paper} />
    </div>
  );
}

/**
 * The same instructions reopened from the banner during the test. A dialog
 * rather than a screen change, because the instruction phase is over and its
 * clock has been spent — reopening the phase would be a way back in.
 */
export function InstructionsDialog({
  paper,
  open,
  onClose,
}: {
  paper: WatchPaper;
  open: boolean;
  onClose: () => void;
}) {
  const body = useRef<HTMLDivElement | null>(null);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Instructions"
    >
      <div className="flex h-full max-h-[92vh] w-full max-w-5xl flex-col rounded bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-gray-300 px-5 py-3">
          <h2 className="text-[16px] font-bold text-[#494949]">Instructions</h2>
          <span className="text-[12px] text-gray-500">
            The test clock keeps running while this is open.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded bg-wt-submit px-5 py-1.5 text-[13px] font-semibold text-white hover:opacity-90"
          >
            Close
          </button>
        </div>

        <div className="relative min-h-0 flex-1">
          <div ref={body} className="wt-scroll-host h-full pr-[9px]">
            <InstructionsBody paper={paper} />
          </div>
          <ScrollRail target={body} axis="vertical" />
        </div>
      </div>
    </div>
  );
}

/**
 * One instruction paragraph: its words, and its picture when it has one.
 *
 * The picture is capped rather than shown at whatever size it was uploaded, so
 * one oversized upload cannot push the rest of the screen out of view.
 */
function Block({ block, lang }: { block: InstructionBlock; lang: "en" | "hi" }) {
  return (
    <div>
      {block[lang] && <p>{block[lang]}</p>}
      {block.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={block.image}
          alt=""
          className="mt-2 h-auto w-full max-w-[420px] rounded border border-gray-300"
          draggable={false}
        />
      )}
    </div>
  );
}
