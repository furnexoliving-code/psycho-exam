import Link from "next/link";
import { StudentHeader } from "@/components/StudentHeader";

/**
 * What a student without the right package sees in place of a section:
 * what the section holds, and the way to the packages. Nothing of the
 * content itself is shown.
 */
export function LockedView({
  profile,
  active,
  title,
  titleHi,
  what,
  whatHi,
  packageKind,
}: {
  profile: { full_name: string; photoUrl: string | null };
  active: "mocks" | "practice";
  title: string;
  titleHi: string;
  what: string;
  whatHi: string;
  packageKind: "sectional" | "full";
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6fb]">
      <StudentHeader name={profile.full_name || "Candidate"} active={active} photoUrl={profile.photoUrl} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-5">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef2fb] text-[26px]" aria-hidden="true">🔒</div>
          <h1 className="mt-4 text-[24px] font-extrabold text-gray-900">{title}</h1>
          <p className="text-[15px] text-gray-500" lang="hi">{titleHi}</p>
          <p className="mx-auto mt-4 max-w-xl text-[14px] text-gray-700">{what}</p>
          <p className="mx-auto mt-1 max-w-xl text-[13px] text-gray-500" lang="hi">{whatHi}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={`/packages#${packageKind}`} className="rounded-md bg-[#0d2a6b] px-6 py-3 text-[14px] font-bold text-white hover:bg-[#0a2158]">
              See packages and prices →
            </Link>
            <Link href="/dashboard" className="rounded-md border border-gray-300 bg-white px-6 py-3 text-[14px] font-semibold text-gray-700 hover:bg-gray-50">
              Back to dashboard
            </Link>
          </div>
          <p className="mt-5 text-[12px] text-gray-500">
            Kautilya Classes student? Your package is added by the institute. Ask at the office if it is missing.
            <span className="block" lang="hi">कौटिल्य क्लासेज़ के छात्र हैं? आपका पैकेज संस्थान जोड़ता है। न दिखे तो ऑफिस में पूछें।</span>
          </p>
        </div>
      </main>
    </div>
  );
}
