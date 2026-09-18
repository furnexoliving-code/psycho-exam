"use client";

const InfoDot = ({ active = false }: { active?: boolean }) => (
  <span
    className={`flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full
                text-[11px] font-bold italic ${
      active ? "bg-white text-wt-pill" : "bg-[#3aa6e8] text-white"
    }`}
    aria-hidden="true"
  >
    i
  </span>
);

/**
 * The pale cyan strip carrying the instruction tab and the test tab.
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
  return (
    // Not a live region: the strip is static chrome, and role="status" would
    // have a screen reader announce it on every change.
    <div className="flex items-center gap-2 bg-wt-bar px-3 py-2">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <span
            key={tab.id}
            className={`flex items-center gap-2 whitespace-nowrap rounded px-3 py-1.5
                        text-[13px] font-semibold ${
              active ? "bg-wt-pill text-white" : "text-wt-tealDark opacity-70"
            }`}
            aria-current={active ? "step" : undefined}
          >
            {tab.label}
            <InfoDot active={active} />
          </span>
        );
      })}
    </div>
  );
}
