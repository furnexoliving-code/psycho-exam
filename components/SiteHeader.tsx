import Link from "next/link";

/**
 * The portal's plain masthead, for the pages outside the exam and the
 * student's own pages: the institute's mark, the portal's name, and a
 * slot on the right for whatever the page needs (the admin's name and
 * sign-out, say). White and plain, as a professional portal is; the exam
 * screen keeps its own hall-style header.
 */
export function SiteHeader({ right }: { right?: React.ReactNode }) {
  return (
    <header className="bg-white shadow-[0_1px_8px_rgba(13,42,107,0.06)]">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-5">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kautilya-logo.png" alt="Kautilya Classes" className="h-10 w-auto" draggable={false} />
          <span className="min-w-0 leading-none">
            <span className="block truncate text-[15px] font-bold text-[#0d2a6b]">KAUTILYA CLASSES</span>
            <span className="mt-1 block truncate text-[8.5px] font-bold tracking-[0.2em] text-[#c8102e]">
              RAILWAY PSYCHO TEST PORTAL
            </span>
          </span>
        </Link>
        <span className="ml-auto hidden text-[11px] font-bold tracking-wider text-[#0d2a6b] md:block">AS PER RDSO PATTERN · RRB ALP CBAT</span>
        {right && <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-4">{right}</div>}
      </div>
      <div
        className="h-[3px]"
        style={{ background: "linear-gradient(90deg,#ff9933 33%,#ffffff 33% 66%,#138808 66%)" }}
        aria-hidden="true"
      />
    </header>
  );
}
