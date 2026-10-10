import Link from "next/link";
import { CONTACT } from "@/lib/contact";
import { LAUNCH } from "@/lib/launch";

/**
 * The offer every public page makes: one free Full Mock with every
 * account, on a screen like the hall. A visitor is sent to make an
 * account when sign-up is open, else to log in or to ask the team for a
 * login on WhatsApp.
 */
export function FreeMockCta({ test, variant = "band" }: { test?: string; variant?: "band" | "card" }) {
  const primary = LAUNCH.signup
    ? { href: "/signup?next=/mocks", label: "Create a free account →" }
    : { href: "/login?next=/mocks", label: "Student Login →" };
  if (variant === "card") {
    return (
      <section className="rounded-2xl border-2 border-dashed border-green-500 bg-green-50 p-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-green-700">Free Full Mock Test</p>
        <h3 className="mt-0.5 text-[18px] font-extrabold leading-tight text-gray-900">All 5 tests, the hall&apos;s timing, your T-Score in each</h3>
        <p className="mt-1 text-[13px] text-gray-700">One free Full Mock with every account{test ? `, with the ${test} in it` : ""}. No package needed.</p>
        <p className="text-[12px] text-gray-600" lang="hi">हर अकाउंट को एक फ्री फुल मॉक, पाँचों टेस्ट असली समय के साथ।</p>
        <Link href={primary.href} className="mt-3 block rounded-md bg-green-600 px-4 py-2.5 text-center text-[14px] font-bold text-white hover:bg-green-700">{primary.label}</Link>
        {!LAUNCH.signup && (
          <a href={CONTACT.whatsapp} className="mt-2 block text-center text-[12px] font-semibold text-green-800 hover:underline">New student? Get a login on WhatsApp</a>
        )}
      </section>
    );
  }
  return (
    <section className="flex flex-wrap items-center gap-5 rounded-2xl border-2 border-dashed border-green-500 bg-green-50 p-5 sm:p-6">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-600 text-[24px]" aria-hidden="true">🎁</div>
      <div className="min-w-0 flex-1">
        <h2 className="text-[20px] font-extrabold leading-tight text-gray-900">
          Sit a free Full Mock{test ? ` with the ${test}` : ""}, on a screen like the hall
        </h2>
        <p className="mt-1 text-[14px] text-gray-700">All five tests in one sitting, the hall&apos;s order and timing, a scorecard out of 30 and your T-Score in each test. Free with every account, no package needed.</p>
        <p className="text-[13px] text-gray-600" lang="hi">पाँचों टेस्ट एक बार में, असली क्रम और समय, हर टेस्ट का T-Score। हर अकाउंट के साथ मुफ़्त।</p>
      </div>
      <div className="flex flex-col gap-2">
        <Link href={primary.href} className="rounded-md bg-green-600 px-5 py-3 text-center text-[14px] font-bold text-white hover:bg-green-700">{primary.label}</Link>
        {!LAUNCH.signup && (
          <a href={CONTACT.whatsapp} className="rounded-md border border-green-600 bg-white px-5 py-2.5 text-center text-[13px] font-semibold text-green-800 hover:bg-green-100">Get a login on WhatsApp</a>
        )}
      </div>
    </section>
  );
}
