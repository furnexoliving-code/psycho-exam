/**
 * The RRB masthead that sits above the exam toolbar. It is decorative chrome
 * drawn inline rather than a scanned image, so the portal ships without
 * depending on third-party artwork.
 */
export function ExamBanner() {
  return (
    <div className="flex h-[52px] w-full items-stretch bg-rrb-teal text-white">
      <div className="flex w-[180px] shrink-0 items-center justify-center bg-gradient-to-r from-emerald-500 to-emerald-400 px-3">
        <span className="text-[13px] font-bold leading-tight tracking-wide">
          KAUTILYA
          <span className="block text-[9px] font-medium opacity-90">CLASSES</span>
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center bg-rrb-banner px-4">
        <div className="text-center">
          <div className="text-[15px] font-bold uppercase tracking-[0.18em] sm:text-lg">
            Railway Recruitment Board
          </div>
          <div className="mx-auto mt-0.5 inline-block bg-white/15 px-2 py-px text-[9px] font-semibold uppercase tracking-widest">
            Computer Based Aptitude Test
          </div>
        </div>
      </div>

      <div className="hidden w-[150px] shrink-0 items-center justify-center bg-rrb-bannerDark md:flex">
        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
          Indian Railways
        </span>
      </div>
    </div>
  );
}
