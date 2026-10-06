"use client";

import { createContext, useContext } from "react";

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
const ExamChromeContext = createContext<{ battery: number | null }>({ battery: null });

export function ExamChromeProvider({
  battery,
  children,
}: {
  battery: number | null;
  children: React.ReactNode;
}) {
  return <ExamChromeContext.Provider value={{ battery }}>{children}</ExamChromeContext.Provider>;
}

export function useExamChrome() {
  return useContext(ExamChromeContext);
}
