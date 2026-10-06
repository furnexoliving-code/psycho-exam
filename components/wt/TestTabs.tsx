"use client";

import { useEffect, useRef, useState } from "react";
import { BATTERIES } from "@/lib/wt/categories";
import { useExamChrome } from "./ExamChrome";

const InfoDot = ({ active = false }: { active?: boolean }) => (
  <span
    className={`flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full
                text-[11px] font-bold italic ${
      active ? "bg-white text-[#1166cc]" : "bg-[#2a8fd6] text-white"
    }`}
    aria-hidden="true"
  >
    i
  </span>
);

/**
 * The grey strip of test tabs, as the real hall screen shows it: this
 * paper's own tabs (its instructions, then its test or its parts) with the
 * battery's number and the test's Hindi name, and around them the other
 * four batteries, greyed out — on view, as in the hall, but not open. A
 * strip wider than the screen scrolls with the arrows at either end.
 *
 * The tabs show where the candidate is; they do not navigate. Moving from the
 * instructions to the test is done with Skip Instruction, and there is no way
 * back — a tab click that could restart the reading clock, or drop a candidate
 * out of a running test, is not something to leave lying around.
 */
export function TestTabs({
  tabs,
  activeId,
  title,
}: {
  tabs: { id: string; label: string }[];
  activeId: string;
  /** The paper's test name, so its Hindi name can follow it on the tabs. */
  title?: string;
}) {
  const { battery } = useExamChrome();
  const own = battery ? BATTERIES.find((b) => b.id === battery) : undefined;
  const others = battery ? BATTERIES.filter((b) => b.id !== battery) : [];
  const before = others.filter((b) => battery !== null && b.id < battery);
  const after = others.filter((b) => battery !== null && b.id > battery);

  // "Memory Test-1" → "Test 1 - Memory Test / स्मृति परीक्षण (Part 1)", as the hall names it.
  const named = (label: string) => {
    const prefix = battery ? `Test ${battery} - ` : "";
    if (!title || !own) return `${prefix}${label}`;
    const bilingual = `${title} / ${own.hindi}`;
    const part = label.match(/-(\d+)$/);
    if (part && label.startsWith(title)) return `${prefix}${bilingual} (Part ${part[1]})`;
    return `${prefix}${label.replace(title, bilingual)}`;
  };

  const strip = useRef<HTMLDivElement | null>(null);
  const [canScroll, setCanScroll] = useState({ left: false, right: false });
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    const measure = () =>
      setCanScroll({ left: el.scrollLeft > 2, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 });
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, []);
  const nudge = (dir: -1 | 1) => strip.current?.scrollBy({ left: dir * 220, behavior: "smooth" });

  return (
    // Not a live region: the strip is static chrome, and role="status" would
    // have a screen reader announce it on every change.
    <div className="flex items-center gap-1 bg-[#eeeeee] px-1.5 pb-1.5 pt-1.5 font-exam">
      <Arrow dir={-1} enabled={canScroll.left} onClick={() => nudge(-1)} />
      <div ref={strip} className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {before.map((b) => (
          <Tab key={`b${b.id}`} label={`Test ${b.id} - ${b.title} / ${b.hindi}`} muted />
        ))}
        {tabs.map((tab) => (
          <Tab key={tab.id} label={named(tab.label)} active={tab.id === activeId} />
        ))}
        {after.map((b) => (
          <Tab key={`b${b.id}`} label={`Test ${b.id} - ${b.title} / ${b.hindi}`} muted />
        ))}
      </div>
      <Arrow dir={1} enabled={canScroll.right} onClick={() => nudge(1)} />
    </div>
  );
}

function Arrow({ dir, enabled, onClick }: { dir: -1 | 1; enabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!enabled}
      data-allow-mouse="true"
      aria-label={dir < 0 ? "Earlier tabs" : "Later tabs"}
      className={`flex h-[26px] w-[16px] shrink-0 items-center justify-center text-[14px] ${enabled ? "text-[#333]" : "text-[#bbb]"}`}
    >
      {dir < 0 ? "◀" : "▶"}
    </button>
  );
}

function Tab({ label, active = false, muted = false }: { label: string; active?: boolean; muted?: boolean }) {
  return (
    <span
      title={label}
      className={`flex max-w-[300px] shrink-0 items-center gap-1.5 rounded-[3px] border px-2 py-1 text-[12px] ${
        active
          ? "border-[#1166cc] bg-[#1166cc] font-bold text-white"
          : muted
            ? "border-[#d6d6d6] bg-[#f6f6f6] text-[#9a9a9a]"
            : "border-[#cfcfcf] bg-white text-[#333333]"
      }`}
      aria-current={active ? "step" : undefined}
      aria-disabled={muted || undefined}
    >
      <span className="min-w-0 truncate">{label}</span>
      <InfoDot active={active} />
    </span>
  );
}
