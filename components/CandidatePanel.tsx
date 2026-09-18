/** The candidate photo and name block pinned to the right of the tab strip. */
export function CandidatePanel({ name }: { name: string }) {
  return (
    <div className="flex w-[190px] shrink-0 flex-col items-center gap-1 border-l border-gray-300 px-3 py-2">
      <div className="h-[72px] w-[68px] border border-gray-400 bg-gray-100 p-1">
        <svg viewBox="0 0 60 70" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id="avatar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cfd8de" />
              <stop offset="100%" stopColor="#6b7a85" />
            </linearGradient>
          </defs>
          <circle cx="30" cy="20" r="13" fill="url(#avatar)" />
          <path d="M8 70 C8 48 52 48 52 70 Z" fill="url(#avatar)" />
          <path d="M30 40 L24 70 L36 70 Z" fill="#ffffff" opacity="0.85" />
        </svg>
      </div>
      <span className="text-center text-[13px] font-semibold leading-tight text-[#1a4f8a]">
        {name}
      </span>
    </div>
  );
}
