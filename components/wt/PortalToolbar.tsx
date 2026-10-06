"use client";

/** Countdown as HH:MM:SS, the format this portal's toolbar shows. */
export function clock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

/**
 * The grey row under the charcoal bar, as the real hall screen has it: the
 * paper's name on the left, the countdown and the fullscreen switch on the
 * right, and beside them the candidate's photo box and name. The tab strip
 * follows on the same grey, so the two read as one panel.
 */
export function PortalToolbar({
  title,
  label = "Time Left",
  secondsLeft,
  paused,
  showPause = true,
  showFullscreen = true,
  onTogglePause,
  onToggleFullscreen,
  rollNo,
  name,
}: {
  title: string;
  /** Which clock is showing — the instruction screen has its own. */
  label?: string;
  secondsLeft: number;
  paused: boolean;
  /** Switched off per paper in the admin panel. */
  showPause?: boolean;
  showFullscreen?: boolean;
  onTogglePause: () => void;
  onToggleFullscreen: () => void;
  rollNo: string;
  name: string;
}) {
  const urgent = secondsLeft <= 60;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 bg-[#eeeeee] px-3 pb-1 pt-2 font-exam">
      <span className="truncate text-[14px] font-bold text-gray-900">{title}</span>

      <div
        className={`ml-auto whitespace-nowrap text-[13px] font-bold ${
          urgent ? "animate-pulse text-red-700" : "text-gray-900"
        }`}
        role="timer"
      >
        {label} : <span className="font-mono tabular-nums">{clock(secondsLeft)}</span>
      </div>

      {showPause && (
        <ToolbarButton onClick={onTogglePause}>
          {paused ? "▶ Resume" : "❚❚ Pause"}
        </ToolbarButton>
      )}
      {showFullscreen && (
        <ToolbarButton onClick={onToggleFullscreen}>Switch Fullscreen</ToolbarButton>
      )}

      <div className="hidden shrink-0 items-center gap-2.5 sm:flex">
        <div className="flex h-[44px] w-[44px] items-center justify-center border border-[#bbbbbb] bg-[#dfe6ee]">
          <svg viewBox="0 0 48 48" className="h-[34px] w-[34px]" aria-hidden="true">
            <circle cx="24" cy="17" r="10" fill="#8fa3b8" />
            <path d="M6 46c2-12 10-16 18-16s16 4 18 16z" fill="#8fa3b8" />
          </svg>
        </div>
        <div className="leading-tight">
          <div className="whitespace-nowrap text-[14px] font-bold text-gray-900">{name}</div>
          {rollNo && rollNo !== "—" && (
            <div className="whitespace-nowrap text-[10px] font-semibold text-gray-600">Roll No: {rollNo}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="shrink-0 rounded border border-gray-500 bg-white px-3 py-1 text-[12px]
                 font-semibold text-gray-800 hover:bg-gray-50"
    >
      {children}
    </button>
  );
}
