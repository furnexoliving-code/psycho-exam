import Link from "next/link";
import { BuyButton } from "@/components/BuyButton";
import { CONTACT } from "@/components/landing/LandingPage";
import { formatDate } from "@/lib/format-time";
import { KIND_LABEL, rupees, type Enrollment, type Package } from "@/lib/packages";

const Y = "#ff9933";

const KIND_POINTS: Record<Package["kind"], string[]> = {
  sectional: ["All practice papers of the 5 tests", "Up to 3 attempts per paper", "Best T-Score per paper, weakest first", "Today's plan on the dashboard"],
  full: ["Every Full Mock Test", "All 5 tests in one sitting, hall order", "Scorecard out of 30, shareable", "Batch leaderboard"],
  combo: ["Everything in Sectional", "Everything in Full Mock", "The complete CBAT preparation", "Best value"],
};

export interface PackagesInput {
  /** Null for a visitor who is not signed in. */
  profile: { full_name: string } | null;
  packages: Package[];
  freeMock: { name: string; slug: string } | null;
  /** True when Razorpay is set up; false offers WhatsApp instead. */
  online: boolean;
  /** The student's active enrollments, by package id. */
  held: Map<string, Enrollment>;
  paid: boolean;
  /** The code typed on the page, checked: the price it gives per package, or why it does not. */
  coupon?: { code: string; message: string | null; prices: Map<string, { price: number; discount: number }> } | null;
}

/** The packages on sale and the free mock; the markup alone, drawn from what the page loaded. */
export function PackagesView({ profile, packages, freeMock, online, held, paid, coupon = null }: PackagesInput) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      {paid && (
        <p className="mb-6 rounded-xl border border-green-300 bg-green-50 px-5 py-4 text-[14px] font-semibold text-green-800">
          ✓ Payment received. Your package is active: open the dashboard and start.
          <span className="block font-normal" lang="hi">भुगतान मिल गया। आपका पैकेज चालू है, डैशबोर्ड खोलकर शुरू करें।</span>
          <Link href="/dashboard" className="mt-2 inline-block rounded bg-[#0d2a6b] px-4 py-1.5 text-[13px] font-bold text-white">Go to dashboard →</Link>
        </p>
      )}
      <p className="text-[12px] font-bold uppercase tracking-[0.25em] text-[#c8102e]">RRB ALP Psycho Test · Packages</p>
      <h1 className="mt-2 text-[30px] font-extrabold text-gray-900 sm:text-[38px]">Pick what you need. Start today.</h1>
      <p className="mt-2 max-w-2xl text-[15px] text-gray-600">
        Sectional tests for daily practice, Full Mock Tests for exam-day rehearsal, or both together. Every account gets one free Full Mock to try first.
        <span className="block text-[14px] text-gray-500" lang="hi">रोज़ के अभ्यास के लिए सेक्शनल, परीक्षा जैसी रिहर्सल के लिए फुल मॉक, या दोनों। हर अकाउंट को एक फ्री फुल मॉक।</span>
      </p>

      {/* Free mock */}
      <section id="free" className="mt-8 flex flex-wrap items-center gap-5 rounded-2xl border-2 border-dashed border-green-400 bg-green-50 p-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-600 text-[24px]" aria-hidden="true">🎁</div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[20px] font-extrabold text-gray-900">
            Free Full Mock Test <span className="ml-2 rounded bg-green-600 px-2 py-0.5 align-middle text-[11px] font-bold uppercase text-white">₹0</span>
          </h2>
          <p className="mt-1 text-[14px] text-gray-700">
            {freeMock ? <>{freeMock.name}: </> : null}all 5 tests in one sitting with the real timing, and your T-Score at the end. No package needed, just a free account.
          </p>
          <p className="text-[13px] text-gray-500" lang="hi">पाँचों टेस्ट एक बार में, असली समय के साथ, अंत में T-Score। कोई पैकेज नहीं, सिर्फ़ फ्री अकाउंट।</p>
        </div>
        {profile ? (
          <Link href={freeMock ? `/mock/${freeMock.slug}` : "/mocks"} className="rounded-md bg-green-600 px-5 py-3 text-[14px] font-bold text-white hover:bg-green-700">
            {freeMock ? "Start the free mock →" : "See Full Mocks →"}
          </Link>
        ) : (
          <Link href="/signup?next=/packages" className="rounded-md bg-green-600 px-5 py-3 text-[14px] font-bold text-white hover:bg-green-700">
            Create free account →
          </Link>
        )}
      </section>

      {/* Coupon */}
      <form method="get" action="/packages" className="mt-6 flex flex-wrap items-end gap-2">
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-gray-700">Have a coupon code? <span lang="hi">कूपन कोड?</span></span>
          <input name="coupon" defaultValue={coupon?.code ?? ""} placeholder="KAUTILYA100" className="w-48 rounded-md border border-gray-400 px-3 py-2 text-[14px] uppercase" />
        </label>
        <button type="submit" className="rounded-md border border-[#0d2a6b] px-4 py-2 text-[14px] font-bold text-[#0d2a6b] hover:bg-[#eef2fb]">Apply</button>
        {coupon && (
          <span className={`text-[13px] font-semibold ${coupon.message ? "text-red-700" : "text-green-700"}`}>
            {coupon.message ?? `✓ Code ${coupon.code} applied`}
          </span>
        )}
      </form>

      {/* Packages */}
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {packages.length === 0 && (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-[14px] text-gray-500 md:col-span-3">
            Packages will be listed here soon. Ask at the office or on WhatsApp.
          </p>
        )}
        {packages.map((p) => {
          const mine = held.get(p.id) ?? null;
          const best = p.kind === "combo";
          const off = coupon?.prices.get(p.id) ?? null;
          const price = off ? off.price : p.priceInr;
          return (
            <section
              key={p.id}
              id={p.kind}
              className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${best ? "border-[#0d2a6b] ring-2 ring-[#0d2a6b]/20" : "border-gray-200"}`}
            >
              {best && (
                <span className="absolute -top-3 left-6 rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#0d2a6b]" style={{ background: Y }}>
                  Best value
                </span>
              )}
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#c8102e]">{KIND_LABEL[p.kind]}</p>
              <h2 className="mt-1 text-[22px] font-extrabold leading-tight text-gray-900">{p.name}</h2>
              {p.nameHi && <p className="text-[13px] text-gray-500" lang="hi">{p.nameHi}</p>}
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-[36px] font-extrabold text-[#0d2a6b]">{rupees(price)}</span>
                {off ? (
                  <span className="text-[15px] text-gray-400 line-through">{rupees(p.priceInr)}</span>
                ) : (
                  p.mrpInr && p.mrpInr > p.priceInr && <span className="text-[15px] text-gray-400 line-through">{rupees(p.mrpInr)}</span>
                )}
                {off && <span className="rounded bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-800">−{rupees(off.discount)} with {coupon?.code}</span>}
              </div>
              <p className="text-[12px] text-gray-500">{p.validityDays ? `Valid ${p.validityDays} days from purchase` : "No expiry"} · incl. all taxes</p>
              <ul className="mt-4 flex-1 space-y-1.5 text-[14px] text-gray-700">
                {KIND_POINTS[p.kind].map((pt) => (
                  <li key={pt} className="flex gap-2">
                    <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-700" aria-hidden="true">✓</span>
                    {pt}
                  </li>
                ))}
              </ul>
              {p.description && <p className="mt-3 text-[12px] text-gray-500">{p.description}</p>}
              <div className="mt-5">
                {mine ? (
                  <p className="rounded-md bg-green-50 px-4 py-3 text-center text-[13px] font-bold text-green-800">
                    ✓ Active{mine.expiresAt ? ` till ${formatDate(mine.expiresAt.slice(0, 10))}` : ""}
                  </p>
                ) : !profile ? (
                  <Link href={`/signup?next=/packages`} className={`block rounded-md px-4 py-3 text-center text-[14px] font-bold ${best ? "bg-[#0d2a6b] text-white hover:bg-[#0a2158]" : "border border-[#0d2a6b] text-[#0d2a6b] hover:bg-[#eef2fb]"}`}>
                    Create account to buy
                  </Link>
                ) : online ? (
                  <BuyButton slug={p.slug} coupon={off ? coupon?.code : ""} label={`Buy · ${rupees(price)}`} className={`w-full rounded-md px-4 py-3 text-center text-[14px] font-bold disabled:opacity-60 ${best ? "bg-[#0d2a6b] text-white hover:bg-[#0a2158]" : "border border-[#0d2a6b] text-[#0d2a6b] hover:bg-[#eef2fb]"}`} />
                ) : (
                  <a href={CONTACT.whatsapp} className={`block rounded-md px-4 py-3 text-center text-[14px] font-bold ${best ? "bg-[#0d2a6b] text-white hover:bg-[#0a2158]" : "border border-[#0d2a6b] text-[#0d2a6b] hover:bg-[#eef2fb]"}`}>
                    Buy on WhatsApp · {rupees(price)}
                  </a>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-6 text-[13px] text-gray-600">
        {online ? (
          <>Pay securely by UPI, card or net banking through Razorpay. The package is added the moment the payment goes through.</>
        ) : (
          <>Pay at the Kautilya Classes office or on WhatsApp ({CONTACT.phone}); the package is added to your account the same day.</>
        )}
        <span className="block text-[12px] text-gray-500">Kautilya Classes students get their package from the institute. See the <Link href="/refund-policy" className="underline">refund policy</Link>.</span>
      </p>
    </main>
  );
}
