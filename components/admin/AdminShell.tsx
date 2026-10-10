import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { AdminNav, type NavGroup } from "@/components/admin/AdminNav";
import { EXAMS, LIVE_EXAM } from "@/lib/exams";

/**
 * The panel's frame: a top bar with the institute's mark, the exam the
 * panel is working in, a search for students and the account signed in;
 * a sidebar of the pages grouped by what they are about (the menu button
 * on a narrow screen); and the page itself. The exam switch names the
 * series to come beside the one that is live, so the panel is laid out
 * for them already.
 */
export function AdminShell({
  profile,
  groups,
  canSearch,
  children,
}: {
  profile: { name: string; role: string };
  groups: NavGroup[];
  /** Whether the account may search students (admins only). */
  canSearch: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f3f5f9]">
      <header className="sticky top-0 z-30 bg-white shadow-[0_1px_8px_rgba(13,42,107,0.08)]">
        <div className="flex items-center gap-3 px-4 py-2 sm:px-5">
          <Link href="/admin" className="flex min-w-0 shrink-0 items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/kautilya-logo.png" alt="Kautilya Classes" className="h-9 w-auto" draggable={false} />
            <span className="min-w-0 leading-none">
              <span className="block truncate text-[14px] font-bold text-[#0d2a6b]">KAUTILYA CLASSES</span>
              <span className="mt-1 block truncate text-[8.5px] font-bold tracking-[0.2em] text-[#c8102e]">ADMIN PANEL</span>
            </span>
          </Link>

          <ExamSwitch className="hidden md:flex" />

          {canSearch && (
            <form action="/admin/students" method="get" role="search" className="ml-auto hidden min-w-0 items-center sm:flex">
              <input
                type="search"
                name="q"
                placeholder="Search a student: name or mobile"
                aria-label="Search students"
                className="w-56 rounded-l-md border border-gray-300 px-3 py-1.5 text-[12.5px] focus:border-[#0d2a6b] focus:outline-none lg:w-72"
              />
              <button type="submit" className="rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 py-1.5 text-[12.5px] font-semibold text-gray-700 hover:bg-gray-100">Find</button>
            </form>
          )}

          <div className={`flex shrink-0 items-center gap-2 ${canSearch ? "" : "ml-auto"}`}>
            <Link href="/dashboard" className="hidden rounded-md border border-gray-300 px-2.5 py-1.5 text-[11.5px] font-semibold text-gray-700 hover:bg-gray-50 lg:block" title="Open the portal as a student sees it">Student view</Link>
            <span className="hidden text-right leading-tight md:block">
              <span className="block text-[12px] font-bold text-gray-900">{profile.name}</span>
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500">{profile.role}</span>
            </span>
            <span className="hidden sm:block"><SignOutButton tone="light" /></span>
            <details className="relative lg:hidden">
              <summary className="list-none cursor-pointer rounded-md border border-gray-300 px-2.5 py-1.5 text-[13px] font-bold text-gray-800 marker:content-none">☰ Menu</summary>
              <div className="absolute right-0 top-full mt-2 max-h-[80vh] w-72 overflow-y-auto rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
                <ExamSwitch className="mb-3 flex md:hidden" />
                <AdminNav groups={groups} />
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
                  <Link href="/dashboard" className="rounded-md border border-gray-300 px-2.5 py-1.5 text-[11.5px] font-semibold text-gray-700 hover:bg-gray-50">Student view</Link>
                  <span className="sm:hidden"><SignOutButton tone="light" /></span>
                </div>
              </div>
            </details>
          </div>
        </div>
        <div className="h-[3px]" style={{ background: "linear-gradient(90deg,#ff9933 33%,#ffffff 33% 66%,#138808 66%)" }} aria-hidden="true" />
      </header>

      <div className="mx-auto flex w-full max-w-[1440px] flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-gray-200 bg-white px-3 py-5 lg:block">
          <AdminNav groups={groups} />
          <p className="mt-6 px-3 text-[10.5px] leading-relaxed text-gray-400">
            Every change here is logged under Settings &amp; team.
          </p>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

/** The exam the panel works in, and the series to come. */
function ExamSwitch({ className = "" }: { className?: string }) {
  return (
    <div className={`items-center gap-1 rounded-lg bg-gray-100 p-1 ${className}`} role="group" aria-label="Exam">
      {EXAMS.map((e) =>
        e.id === LIVE_EXAM ? (
          <span key={e.id} className="rounded-md bg-[#0d2a6b] px-2.5 py-1 text-[11.5px] font-bold text-white shadow-sm" title={e.note}>
            {e.short} <span className="ml-1 rounded bg-[#22c55e] px-1 text-[9px] uppercase tracking-wide">live</span>
          </span>
        ) : (
          <span key={e.id} className="cursor-not-allowed rounded-md px-2.5 py-1 text-[11.5px] font-semibold text-gray-400" title={`${e.name}: ${e.note}`}>
            {e.short} <span className="ml-1 rounded border border-gray-300 px-1 text-[9px] uppercase tracking-wide">soon</span>
          </span>
        ),
      )}
    </div>
  );
}
