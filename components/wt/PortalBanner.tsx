/**
 * The masthead strip: institute mark, the RRB board panel with the national
 * emblem and a locomotive photo, then the Instructions / Question Paper
 * buttons on the far right.
 *
 * Everything is drawn inline — no third-party artwork ships with the repo.
 */
export function PortalBanner({
  onInstructions,
  onQuestionPaper,
}: {
  onInstructions?: () => void;
  onQuestionPaper?: () => void;
}) {
  return (
    <div className="flex h-[58px] items-stretch bg-wt-teal">
      <div className="flex w-[200px] shrink-0 items-center gap-2 px-3">
        <InstituteMark />
        <div className="leading-none">
          <div className="text-[13px] font-extrabold tracking-tight text-white">
            KAUTILYA
          </div>
          <div className="text-[8px] font-semibold uppercase tracking-[0.15em] text-white/85">
            Classes
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-4 bg-wt-banner px-4">
        <Emblem />
        <div className="text-center leading-tight">
          <div className="text-[17px] font-extrabold tracking-wide text-white sm:text-xl">
            RAILWAY RECRUITMENT BOARD
          </div>
          <div className="text-[8px] font-semibold uppercase tracking-[0.22em] text-white/85 sm:text-[9px]">
            Government of India · Ministry of Railways
          </div>
          <div className="mt-0.5 inline-block bg-white px-2 py-px text-[9px] font-bold uppercase tracking-wider text-wt-banner">
            Be best at psycho test
          </div>
        </div>
        <Locomotive />
        <RrbRoundel />
      </div>

      <div className="flex shrink-0 items-center gap-2 px-3">
        <BannerButton onClick={onInstructions}>Instructions</BannerButton>
        <BannerButton onClick={onQuestionPaper}>Question Paper</BannerButton>
      </div>
    </div>
  );
}

function BannerButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded border border-white/70 bg-white px-3 py-1.5 text-[12px]
                 font-semibold text-gray-800 hover:bg-gray-50"
    >
      {children}
    </button>
  );
}

function InstituteMark() {
  return (
    <svg viewBox="0 0 40 40" className="h-8 w-8 shrink-0" aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="#ffffff" />
      <path d="M6 26c6-10 22-10 28 0-6-4-22-4-28 0z" fill="#1aa7c4" />
      <path d="M9 19c5-7 17-7 22 0-5-3-17-3-22 0z" fill="#63cbdd" />
    </svg>
  );
}

function Emblem() {
  return (
    <svg viewBox="0 0 60 70" className="hidden h-[42px] w-[34px] shrink-0 sm:block" aria-hidden="true">
      <g fill="#ffffff">
        <circle cx="22" cy="16" r="7" />
        <circle cx="38" cy="16" r="7" />
        <rect x="18" y="20" width="24" height="9" rx="3" />
        <rect x="14" y="30" width="32" height="5" rx="2" />
        <rect x="17" y="36" width="26" height="4" rx="1.5" />
        <circle cx="30" cy="43" r="3.4" fill="none" stroke="#ffffff" strokeWidth="1.4" />
        <rect x="20" y="48" width="20" height="3" rx="1" />
        <rect x="26" y="52" width="8" height="12" rx="1" />
      </g>
    </svg>
  );
}

function Locomotive() {
  return (
    <svg viewBox="0 0 90 50" className="hidden h-[42px] w-[76px] shrink-0 md:block" aria-hidden="true">
      <rect width="90" height="50" fill="#7fb2d8" />
      <rect y="34" width="90" height="16" fill="#8ab36a" />
      <g fill="#1f6fa8">
        <rect x="18" y="8" width="44" height="30" rx="3" />
        <rect x="62" y="16" width="14" height="22" rx="2" />
      </g>
      <rect x="24" y="13" width="32" height="9" rx="1.5" fill="#cfe4f2" />
      <g fill="#123c5c">
        <circle cx="30" cy="40" r="4" />
        <circle cx="44" cy="40" r="4" />
        <circle cx="66" cy="40" r="3.4" />
      </g>
      <rect x="10" y="36" width="80" height="2.5" fill="#5b5b5b" />
    </svg>
  );
}

function RrbRoundel() {
  return (
    <svg viewBox="0 0 60 60" className="hidden h-[42px] w-[42px] shrink-0 sm:block" aria-hidden="true">
      <circle cx="30" cy="30" r="28" fill="#ffffff" />
      <circle cx="30" cy="30" r="28" fill="none" stroke="#1f4e9c" strokeWidth="2.5" />
      <circle cx="30" cy="30" r="21" fill="none" stroke="#1f4e9c" strokeWidth="1.2" />
      <g fill="#1f4e9c">
        <rect x="23" y="21" width="14" height="15" rx="2" />
        <rect x="26" y="37" width="8" height="3.5" rx="1" />
        <circle cx="26" cy="43" r="2.2" />
        <circle cx="34" cy="43" r="2.2" />
      </g>
    </svg>
  );
}
