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

/** The pale cyan strip carrying the instruction tab and the test tab. */
export function TestTabs({
  tabs,
  activeId,
  onSelect,
}: {
  tabs: { id: string; label: string }[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-wt-bar px-3 py-2">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            className={`flex items-center gap-2 whitespace-nowrap rounded px-3 py-1.5
                        text-[13px] font-semibold ${
              active
                ? "bg-wt-pill text-white"
                : "text-wt-tealDark hover:bg-white/60"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
            <InfoDot active={active} />
          </button>
        );
      })}
    </div>
  );
}
