"use client";

import { useEffect } from "react";

/**
 * Turns off the mouse wheel inside the exam.
 *
 * Everything else about the mouse keeps working: the cursor shows, clicking an
 * option answers it, and the question column keeps a real scrollbar that can
 * still be dragged — the bar is how a candidate sees how much paper is left.
 * Only the wheel and trackpad gesture are taken away, so moving through the
 * questions is a deliberate act.
 *
 * Because the column is a real scroll container rather than `overflow: hidden`,
 * the wheel has to be cancelled event by event. That needs `passive: false`;
 * without it the browser ignores preventDefault on wheel.
 *
 * A blocked gesture is silent — no banner, no message. The scrollbars show
 * there is more to see, and dragging one still works.
 */
export function useScrollLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const onWheel = (event: WheelEvent) => {
      // Leave pinch-zoom alone; it is a browser accessibility affordance.
      if (event.ctrlKey) return;
      event.preventDefault();
    };

    const onKeyScroll = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      // A focused button keeps Space: it is how the keyboard presses it.
      if (target && /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(target.tagName)) return;
      // Space and PageUp/PageDown scroll the container by default.
      if ([" ", "PageUp", "PageDown"].includes(event.key)) {
        event.preventDefault();
      }
    };

    // passive:false is required, or preventDefault on wheel is ignored.
    // removeEventListener takes no `passive`, so the options differ per call.
    const addOpts: AddEventListenerOptions = { passive: false };
    // Touch is left alone: a swipe is the touch equivalent of dragging the
    // scrollbar, which is kept on purpose. Blocking it left a phone with a
    // nine-pixel rail as the only way down the paper.
    window.addEventListener("wheel", onWheel, addOpts);
    window.addEventListener("keydown", onKeyScroll);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyScroll);
    };
  }, [enabled]);
}

export interface ExamKeyHandlers {
  onSelect: (optionIndex: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onFirst: () => void;
  onLast: () => void;
  onClear: () => void;
  onSubmit: () => void;
  onToggleHelp: () => void;
}

/**
 * The exam's key bindings, registered once at page level so the candidate
 * never has to hunt for focus before a key does something.
 */
export function useExamKeys(handlers: ExamKeyHandlers, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) {
        if ((target as HTMLInputElement).type !== "radio") return;
      }
      // Enter and Space on a focused button press that button. Taking them as
      // "next question" left Submit, Pause and the rest unreachable by key.
      if (target && /^(BUTTON|A)$/.test(target.tagName) && ["Enter", " "].includes(event.key)) {
        return;
      }
      // Never shadow a browser shortcut.
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      switch (event.key) {
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
          event.preventDefault();
          handlers.onSelect(Number(event.key) - 1);
          break;

        case "ArrowDown":
        case "ArrowRight":
        case "Enter":
        case "n":
        case "N":
          event.preventDefault();
          handlers.onNext();
          break;

        case "ArrowUp":
        case "ArrowLeft":
        case "p":
        case "P":
          event.preventDefault();
          handlers.onPrevious();
          break;

        case "Home":
          event.preventDefault();
          handlers.onFirst();
          break;

        case "End":
          event.preventDefault();
          handlers.onLast();
          break;

        case "c":
        case "C":
        case "Backspace":
        case "Delete":
          event.preventDefault();
          handlers.onClear();
          break;

        case "s":
        case "S":
          event.preventDefault();
          handlers.onSubmit();
          break;

        case "?":
        case "h":
        case "H":
          event.preventDefault();
          handlers.onToggleHelp();
          break;

        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers, enabled]);
}

/** The bindings, for the on-screen strip and the instruction page. */
export const KEY_HELP: { keys: string; action: string; actionHi: string }[] = [
  { keys: "1 – 5", action: "Choose that option", actionHi: "वह विकल्प चुनें" },
  { keys: "↓ / → / Enter / N", action: "Next question", actionHi: "अगला प्रश्न" },
  { keys: "↑ / ← / P", action: "Previous question", actionHi: "पिछला प्रश्न" },
  { keys: "Home / End", action: "First / last question", actionHi: "पहला / अंतिम प्रश्न" },
  { keys: "C / Backspace", action: "Clear this answer", actionHi: "उत्तर हटाएँ" },
  { keys: "S", action: "Submit the test", actionHi: "टेस्ट जमा करें" },
  { keys: "H or ?", action: "Show or hide this help", actionHi: "सहायता दिखाएँ/छिपाएँ" },
];
