"use client";

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
 * battery's number in front, and around them the other four batteries,
 * greyed out — on view, as in the hall, but not open.
 *
 * The tabs show where the candidate is; they do not navigate. Moving from the
 * instructions to the test is done with Skip Instruction, and there is no way
 * back — a tab click that could restart the reading clock, or drop a candidate
 * out of a running test, is not something to leave lying around.
 */
export function TestTabs({
  tabs,
  activeId,
}: {
  tabs: { id: string; label: string }[];
  activeId: string;
}) {
  const { battery } = useExamChrome();
  const prefix = battery ? `Test ${battery} - ` : "";
  const others = battery ? BATTERIES.filter((b) => b.id !== battery) : [];
  const before = others.filter((b) => battery !== null && b.id < battery);
  const after = others.filter((b) => battery !== null && b.id > battery);

  return (
    // Not a live region: the strip is static chrome, and role="status" would
    // have a screen reader announce it on every change.
    <div className="flex items-center gap-1.5 overflow-hidden bg-[#eeeeee] px-2.5 pb-2 pt-1 font-exam">
      {before.map((b) => (
        <Tab key={`b${b.id}`} label={`Test ${b.id} - ${b.title}`} muted />
      ))}
      {tabs.map((tab) => (
        <Tab key={tab.id} label={`${prefix}${tab.label}`} active={tab.id === activeId} />
      ))}
      {after.map((b) => (
        <Tab key={`b${b.id}`} label={`Test ${b.id} - ${b.title}`} muted />
      ))}
    </div>
  );
}

function Tab({ label, active = false, muted = false }: { label: string; active?: boolean; muted?: boolean }) {
  return (
    <span
      title={label}
      className={`flex max-w-[170px] shrink-0 items-center gap-1.5 rounded-[3px] border px-2 py-1 text-[12px] ${
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
