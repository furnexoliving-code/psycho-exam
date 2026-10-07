import type { Notice } from "@/lib/notices";

/**
 * The institute's notices, at the top of the dashboard: a board with a
 * pinned-note look, a soft pulse on the badge so a new one catches the eye
 * without blinking at the reader. Nothing when the board is empty.
 */
export function NoticeBoard({ notices }: { notices: Notice[] }) {
  if (notices.length === 0) return null;
  return (
    <section
      className="relative mb-4 overflow-hidden rounded-[16px] border border-[#f2c66d] shadow-[0_8px_24px_rgba(180,120,0,0.12)]"
      style={{ background: "linear-gradient(135deg,#fff8e6 0%,#fff3d1 100%)" }}
      aria-label="Notice board"
    >
      <div className="absolute inset-y-0 left-0 w-[6px] bg-[#f59e0b]" aria-hidden="true" />
      <div className="flex flex-col gap-2.5 px-4 py-3.5 pl-5 sm:flex-row sm:items-start sm:gap-3 sm:px-5 sm:pl-6">
        <div className="flex shrink-0 items-center gap-2">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#f59e0b] text-[18px] shadow" aria-hidden="true">
            📢
            <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600" />
            </span>
          </span>
          <div className="leading-tight">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#92400e]">Notice board</div>
            <div className="text-[11px] font-semibold text-[#b45309]" lang="hi">सूचना पट्ट</div>
          </div>
        </div>
        <ul className="min-w-0 flex-1 divide-y divide-[#f2c66d]/60">
          {notices.map((n) => (
            <li key={n.id} className="py-1.5 first:pt-0 last:pb-0">
              {n.en && <p className="text-[14px] font-semibold text-[#3b2a06]">{n.en}</p>}
              {n.hi && <p className="text-[13px] text-[#6b4b0a]" lang="hi">{n.hi}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
