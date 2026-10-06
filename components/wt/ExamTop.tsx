"use client";

import { clock } from "./PortalToolbar";
import { TestTabs } from "./TestTabs";
import { PhotoBox } from "./PhotoBox";
import { useExamChrome } from "./ExamChrome";

/**
 * The grey panel under the charcoal bar, laid out as the hall screen is:
 * the tab strip, then the Sections row with the countdown at its right
 * end, and down the right side the candidate's photo box and name,
 * spanning both rows.
 *
 * Both exam screens render this in place of a toolbar and a tab strip;
 * the Following Directions screen passes no sections and gets a single
 * chip with its test's name, as the hall shows for that test.
 */
export function ExamTop({
  tabs,
  activeId,
  title,
  paperName,
  label = "Time Left",
  secondsLeft,
  paused,
  showPause = false,
  showFullscreen = true,
  onTogglePause,
  onToggleFullscreen,
  name,
  rollNo,
  sections,
}: {
  tabs: { id: string; label: string }[];
  activeId: string;
  /** The paper's test name, for the tabs' Hindi names and the default section chip. */
  title: string;
  /** The paper's own name, shown small beside the countdown. */
  paperName?: string;
  label?: string;
  secondsLeft: number;
  paused: boolean;
  showPause?: boolean;
  showFullscreen?: boolean;
  onTogglePause: () => void;
  onToggleFullscreen: () => void;
  name: string;
  rollNo?: string;
  /** The Sections row's chips; the test's name alone when not given. */
  sections?: React.ReactNode;
}) {
  const urgent = secondsLeft <= 60;
  const { photoUrl } = useExamChrome();
  return (
    <div className="grid grid-cols-[1fr_auto] border-b border-[#dcdcdc] bg-[#eeeeee] font-exam">
      <div className="min-w-0">
        <TestTabs tabs={tabs} activeId={activeId} title={title} />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 pb-2 pt-0.5">
          <div>
            <div className="text-[11px] font-semibold text-[#333]">Sections</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {sections ?? <SectionChip>{title}</SectionChip>}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3 self-end">
            {paperName && <span className="hidden text-[11px] text-[#777] lg:inline">{paperName}</span>}
            {showPause && (
              <button type="button" onClick={onTogglePause} data-allow-mouse="true" className="rounded border border-gray-500 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-gray-800 hover:bg-gray-50">
                {paused ? "▶ Resume" : "❚❚ Pause"}
              </button>
            )}
            {showFullscreen && (
              <button type="button" onClick={onToggleFullscreen} data-allow-mouse="true" className="rounded border border-gray-500 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-gray-800 hover:bg-gray-50">
                Switch Fullscreen
              </button>
            )}
            <span className={`whitespace-nowrap text-[13px] font-bold ${urgent ? "animate-pulse text-red-700" : "text-[#222]"}`} role="timer">
              {label} : <span className="font-mono tabular-nums">{clock(secondsLeft)}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="hidden items-center gap-3 border-l border-[#dcdcdc] bg-white px-4 py-2 sm:flex">
        <PhotoBox photoUrl={photoUrl} />
        <div className="leading-tight">
          <div className="max-w-[150px] truncate text-[15px] font-semibold text-gray-900">{name}</div>
          {rollNo && rollNo !== "—" && <div className="text-[10px] text-gray-600">Roll No: {rollNo}</div>}
        </div>
      </div>
    </div>
  );
}

/** One chip in the Sections row: the group on screen, as the hall names it. */
export function SectionChip({ children, active = true, onClick, disabled = true }: { children: React.ReactNode; active?: boolean; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      data-allow-mouse="true"
      disabled={disabled}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-1.5 rounded-[3px] px-2.5 py-1 text-[12px] font-bold ${
        active ? "bg-[#1166cc] text-white" : "border border-[#1166cc]/40 bg-white text-[#1166cc] hover:bg-[#eef4fb]"
      } disabled:cursor-default`}
    >
      {children}
      <span className={`flex h-[14px] w-[14px] items-center justify-center rounded-full text-[10px] font-bold italic ${active ? "bg-white text-[#1166cc]" : "bg-[#2a8fd6] text-white"}`} aria-hidden="true">i</span>
    </button>
  );
}
