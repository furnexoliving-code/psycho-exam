"use client";

import { createContext, useCallback, useContext } from "react";
import { useRouter } from "next/navigation";
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
const ExamChromeContext = createContext<{
  battery: number | null;
  mockSummary: MockSummaryTest[] | null;
  photoUrl: string | null;
  /** Opens a submitted paper's result (the break screen, inside a mock). */
  goToResult: (paperId: string) => void;
}>({
  battery: null,
  mockSummary: null,
  photoUrl: null,
  goToResult: (paperId) => window.location.assign(`/test/${paperId}/result`),
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
  const router = useRouter();
  const inMock = mockSummary !== null;
  // How a submitted paper moves on to its result. On its own, a full load:
  // a portal deployed afresh while the paper was open has new script files,
  // and a client-side move could fail on the old ones. Inside a Full Mock,
  // a client-side move instead, so the browser's fullscreen, switched on
  // once, carries through every break and every test of the mock (a full
  // load always drops it, and only a click could bring it back).
  const goToResult = useCallback(
    (paperId: string) => {
      const url = `/test/${paperId}/result`;
      if (inMock) router.replace(url);
      else window.location.assign(url);
    },
    [inMock, router],
  );
  return <ExamChromeContext.Provider value={{ battery, mockSummary, photoUrl, goToResult }}>{children}</ExamChromeContext.Provider>;
}

export function useExamChrome() {
  return useContext(ExamChromeContext);
}
