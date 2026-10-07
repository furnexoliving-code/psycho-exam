import Link from "next/link";
import { UserMenu } from "@/components/UserMenu";

/**
 * The student pages' masthead: the institute's mark, the page tabs, and
 * who is signed in. White and plain, as a professional portal is; the
 * exam screen keeps its own hall-style header.
 */
export function StudentHeader({
  name,
  active = "dashboard",
  photoUrl = null,
}: {
  name: string;
  active?: "dashboard" | "mocks" | "practice" | "results" | "profile";
  /** The candidate's own photo, when they have given one. */
  photoUrl?: string | null;
}) {
  const tabs = [
    { id: "dashboard", label: "Dashboard", href: "/dashboard" },
    { id: "mocks", label: "Full Mocks", href: "/dashboard#mocks" },
    { id: "practice", label: "Practice", href: "/dashboard#practice" },
    { id: "results", label: "My results", href: "/dashboard#results" },
  ] as const;

  return (
    <header className="bg-white shadow-[0_1px_8px_rgba(13,42,107,0.06)]">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-5">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kautilya-logo.png" alt="Kautilya Classes" className="h-10 w-auto" draggable={false} />
          <span className="leading-none">
            <span className="block text-[15px] font-bold text-[#0d2a6b]">KAUTILYA CLASSES</span>
            <span className="mt-1 hidden text-[8.5px] font-bold tracking-[0.2em] text-[#c8102e] sm:block">
              PSYCHO TEST PORTAL · AS PER RDSO PATTERN
            </span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Sections">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold ${
                tab.id === active ? "bg-[#eef2fb] text-[#0d2a6b]" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center">
          <UserMenu name={name} photoUrl={photoUrl} />
        </div>
      </div>
      <div
        className="h-[3px]"
        style={{ background: "linear-gradient(90deg,#ff9933 33%,#ffffff 33% 66%,#138808 66%)" }}
        aria-hidden="true"
      />
    </header>
  );
}
