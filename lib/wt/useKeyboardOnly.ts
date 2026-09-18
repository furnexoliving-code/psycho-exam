"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Locks free scrolling inside the exam.
 *
 * The mouse itself stays fully usable — the cursor shows and clicking an option
 * answers it. Only scrolling is taken away, so a candidate moves through the
 * paper deliberately with the keyboard instead of spinning the wheel.
 *
 * The container is held at `overflow: hidden`, which stops the wheel, the
 * trackpad, a dragged scrollbar and touch panning in one move, while leaving
 * programmatic scrolling (scrollIntoView, scrollTop) working — that is how
 * question navigation still moves the view.
 *
 * The wheel listener on top of that exists only to notice the attempt, so the
 * screen can say what to press instead of silently doing nothing.
 */
export function useScrollLock(enabled: boolean) {
  const [blockedAt, setBlockedAt] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const nudge = () => {
      setBlockedAt((n) => n + 1);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setBlockedAt(0), 2200);
    };

    const onWheel = (event: WheelEvent) => {
      // Leave pinch-zoom alone; it is a browser accessibility affordance.
      if (event.ctrlKey) return;
      event.preventDefault();
      nudge();
    };

    const onTouchMove = (event: TouchEvent) => {
      event.preventDefault();
      nudge();
    };

    const onKeyScroll = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      // Space and PageUp/PageDown scroll the document by default.
      if ([" ", "PageUp", "PageDown"].includes(event.key)) {
        event.preventDefault();
        nudge();
      }
    };

    // passive:false is required, or preventDefault on wheel is ignored.
    // removeEventListener takes no `passive`, so the options differ per call.
    const addOpts: AddEventListenerOptions = { passive: false };
    window.addEventListener("wheel", onWheel, addOpts);
    window.addEventListener("touchmove", onTouchMove, addOpts);
    window.addEventListener("keydown", onKeyScroll);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKeyScroll);
    };
  }, [enabled]);

  return blockedAt > 0;
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
