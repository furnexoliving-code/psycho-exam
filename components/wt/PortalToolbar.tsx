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
 * The white toolbar under the banner: test title, the boxed countdown, pause
 * and fullscreen, and the candidate's roll number and name.
 */
export function PortalToolbar({
  title,
  label = "Time Left",
  secondsLeft,
  paused,
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
  onTogglePause: () => void;
  onToggleFullscreen: () => void;
  rollNo: string;
  name: string;
}) {
  const urgent = secondsLeft <= 60;

  return (
    <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-3 py-2">
      <Logo />
      <span className="text-[14px] font-bold text-gray-900">{title}</span>

      <div
        className={`mx-auto rounded border px-4 py-1.5 text-[14px] font-bold ${
          urgent
            ? "animate-pulse border-red-400 bg-red-50 text-red-700"
            : "border-gray-500 bg-white text-gray-900"
        }`}
        role="timer"
      >
        {label} <span className="font-mono tabular-nums">{clock(secondsLeft)}</span>
      </div>

      <ToolbarButton onClick={onTogglePause}>
        {paused ? "▶ Resume" : "❚❚ Pause"}
      </ToolbarButton>
      <ToolbarButton onClick={onToggleFullscreen}>Switch Fullscreen</ToolbarButton>

      <div className="flex shrink-0 items-end gap-3 border-l border-gray-300 pl-3">
        <Candidate label={`Roll No: ${rollNo}`} />
        <Candidate label={`Name: ${name}`} />
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded border border-gray-500 bg-white px-4 py-1.5 text-[13px]
                 font-semibold text-gray-800 hover:bg-gray-50"
    >
      {children}
    </button>
  );
}

function Candidate({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 40 42" className="h-7 w-7" aria-hidden="true">
        <defs>
          <linearGradient id="wt-av" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d5dde3" />
            <stop offset="100%" stopColor="#6e7d88" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="12" r="8" fill="url(#wt-av)" />
        <path d="M4 42C4 28 36 28 36 42Z" fill="url(#wt-av)" />
      </svg>
      <span className="whitespace-nowrap text-[10px] font-semibold text-gray-700">
        {label}
      </span>
    </div>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 40 40" className="h-7 w-7 shrink-0" aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="#1aa7c4" />
      <path d="M7 26c6-9 20-9 26 0-6-4-20-4-26 0z" fill="#ffffff" />
    </svg>
  );
}
