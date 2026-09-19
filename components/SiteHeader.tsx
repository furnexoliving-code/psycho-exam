import Link from "next/link";

/** The KAUTILYA CLASSES masthead used outside the exam screen. */
export function SiteHeader({
  right,
}: {
  right?: React.ReactNode;
}) {
  return (
    <header className="flex h-[52px] items-stretch bg-rrb-teal text-white">
      <Link
        href="/"
        className="flex w-[110px] shrink-0 items-center justify-center bg-gradient-to-r from-emerald-500 to-emerald-400 px-2 sm:w-[180px] sm:px-3"
      >
        <span className="text-[13px] font-bold leading-tight tracking-wide">
          KAUTILYA
          <span className="block text-[9px] font-medium opacity-90">CLASSES</span>
        </span>
      </Link>

      {/* min-w-0 lets the middle give way on a phone instead of pushing the
          page wider than the screen. */}
      <div className="flex min-w-0 flex-1 items-center justify-center bg-rrb-banner px-2 sm:px-4">
        <div className="min-w-0 text-center">
          <div className="truncate text-[11px] font-bold uppercase tracking-[0.08em] sm:text-[15px] sm:tracking-[0.18em] md:text-lg">
            Railway Recruitment Board
          </div>
          <div className="mx-auto mt-0.5 hidden bg-white/15 px-2 py-px text-[9px] font-semibold uppercase tracking-widest sm:inline-block">
            Computer Based Aptitude Test
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 bg-rrb-bannerDark px-2 sm:px-4">{right}</div>
    </header>
  );
}
