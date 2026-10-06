"use client";

import { createContext, useContext } from "react";
import type { MockSummaryTest } from "@/lib/wt/mock";

/**
 * What the exam screen's chrome needs to know about the paper on screen,
 * beyond what each screen already passes its header: which of the five
 * batteries the paper belongs to, so the tab strip can show the whole test
 * series, the way the real hall screen does, with the other four greyed out.
 *
 * Carried by context so the header pieces can read it without the two exam
 * screens (Following Directions and the picture papers) having to pass it
 * through; the page sets it once around whichever screen it renders.
 */
const ExamChromeContext = createContext<{ battery: number | null; mockSummary: MockSummaryTest[] | null; photoUrl: string | null }>({
  battery: null,
  mockSummary: null,
  photoUrl: null,
});

export function ExamChromeProvider({
  battery,
  mockSummary = null,
  photoUrl = null,
  children,
}: {
  battery: number | null;
  /** Inside a Full Mock: every test of the mock, for the Exam Summary of a break within this paper. */
  mockSummary?: MockSummaryTest[] | null;
  /** The candidate's photo for the header's box; the silhouette without one. */
  photoUrl?: string | null;
  children: React.ReactNode;
}) {
  return <ExamChromeContext.Provider value={{ battery, mockSummary, photoUrl }}>{children}</ExamChromeContext.Provider>;
}

export function useExamChrome() {
  return useContext(ExamChromeContext);
}
