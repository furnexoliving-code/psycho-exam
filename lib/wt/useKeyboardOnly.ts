"use client";

import { useEffect } from "react";

/**
 * Makes the exam keyboard-driven and the mouse inert.
 *
 * What is deliberately NOT blocked: browser zoom, the browser's own chrome,
 * caret browsing, and anything assistive technology needs. Blocking those
 * would lock a candidate out of the exam rather than keep them honest.
 *
 * Mouse suppression here means "the pointer cannot answer or navigate". It is
 * not a security boundary — anyone with devtools can undo it. It exists to
 * make the exam behave like the hall machine, not to stop a determined cheat.
 */
export function useMouseSuppression(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const root = document.documentElement;
    const previousUserSelect = root.style.userSelect;
    root.style.userSelect = "none";
    root.dataset.mouseSuppressed = "true";

    const swallow = (event: Event) => {
      // Let the browser's own UI keep working; only suppress inside the page.
      event.preventDefault();
      event.stopPropagation();
    };

    const onContextMenu = (event: MouseEvent) => swallow(event);

    const onPointer = (event: PointerEvent | MouseEvent) => {
      const target = event.target as HTMLElement | null;
      // An explicit opt-out for controls that must stay clickable, such as the
      // dialog that offers to turn keyboard-only mode off again.
      if (target?.closest("[data-allow-mouse='true']")) return;
      swallow(event);
    };

    const onSelectStart = (event: Event) => swallow(event);
    const onDragStart = (event: Event) => swallow(event);

    const options = { capture: true } as const;
    document.addEventListener("contextmenu", onContextMenu, options);
    document.addEventListener("mousedown", onPointer, options);
    document.addEventListener("mouseup", onPointer, options);
    document.addEventListener("click", onPointer, options);
    document.addEventListener("dblclick", onPointer, options);
    document.addEventListener("selectstart", onSelectStart, options);
    document.addEventListener("dragstart", onDragStart, options);

    return () => {
      root.style.userSelect = previousUserSelect;
      delete root.dataset.mouseSuppressed;
      document.removeEventListener("contextmenu", onContextMenu, options);
      document.removeEventListener("mousedown", onPointer, options);
      document.removeEventListener("mouseup", onPointer, options);
      document.removeEventListener("click", onPointer, options);
      document.removeEventListener("dblclick", onPointer, options);
      document.removeEventListener("selectstart", onSelectStart, options);
      document.removeEventListener("dragstart", onDragStart, options);
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
 * The exam's key bindings. Registered once at the page level rather than per
 * question, so the candidate never has to hunt for focus.
 */
export function useExamKeys(handlers: ExamKeyHandlers, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      // Never hijack a real text field, and leave browser shortcuts alone.
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) {
        if ((target as HTMLInputElement).type !== "radio") return;
      }
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

/** The bindings, for the on-screen help and the instruction page. */
export const KEY_HELP: { keys: string; action: string; actionHi: string }[] = [
  { keys: "1 – 5", action: "Choose that option", actionHi: "वह विकल्प चुनें" },
  { keys: "↓ / → / Enter / N", action: "Next question", actionHi: "अगला प्रश्न" },
  { keys: "↑ / ← / P", action: "Previous question", actionHi: "पिछला प्रश्न" },
  { keys: "Home / End", action: "First / last question", actionHi: "पहला / अंतिम प्रश्न" },
  { keys: "C / Backspace", action: "Clear this answer", actionHi: "उत्तर हटाएँ" },
  { keys: "S", action: "Submit the test", actionHi: "टेस्ट जमा करें" },
  { keys: "H or ?", action: "Show or hide this help", actionHi: "सहायता दिखाएँ/छिपाएँ" },
];
