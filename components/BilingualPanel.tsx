"use client";

import type { ReactNode } from "react";
import { useExam } from "@/lib/exam-store";

/**
 * The real portal shows English and Hindi side by side on wide screens and
 * falls back to the selected language alone when there is no room. The render
 * prop receives the language so callers can pull the right half of each
 * bilingual string.
 */
export function BilingualPanel({
  render,
}: {
  render: (lang: "en" | "hi") => ReactNode;
}) {
  const { state } = useExam();

  return (
    <>
      {/* Side-by-side on large screens. */}
      <div className="hidden divide-x divide-gray-300 xl:grid xl:grid-cols-2">
        <div className="px-5 py-4">{render("en")}</div>
        <div className="px-5 py-4" lang="hi">
          {render("hi")}
        </div>
      </div>

      {/* Single column below xl, honouring the toolbar language selector. */}
      <div className="px-4 py-4 xl:hidden" lang={state.lang}>
        {render(state.lang)}
      </div>
    </>
  );
}
