import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile, isConfigured } from "@/lib/auth";
import { SignUpForm } from "./SignUpForm";
import { LAUNCH } from "@/lib/launch";
import { CONTACT } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Create a free account | Kautilya Classes Railway Psycho Test Portal",
  description: "Create a free account, try the free Full Mock of the RRB ALP psycho test, and buy a test series package when you are ready.",
  robots: LAUNCH.signup ? { index: true, follow: true } : { index: false, follow: true },
  alternates: { canonical: "https://kautilyaonline.com/signup" },
};

const Y = "#ff9933";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  if (isConfigured() && (await getProfile())) redirect(target);

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6fb] md:flex-row">
      <aside className="relative flex flex-col justify-between overflow-hidden bg-[#0d2a6b] px-6 py-6 text-white md:w-[46%] md:px-12 md:py-10">
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-[420px] w-[420px] rounded-full bg-[#1b3f8f] opacity-70" aria-hidden="true" />
        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/kautilya-logo.png" alt="Kautilya Classes" className="h-12 w-auto rounded bg-white p-0.5" draggable={false} />
            <span className="leading-none">
              <span className="block text-[16px] font-bold">KAUTILYA CLASSES</span>
              <span className="mt-1 block text-[9px] font-bold tracking-[0.2em]" style={{ color: Y }}>RAILWAY PSYCHO TEST PORTAL</span>
            </span>
          </Link>
          <h1 className="mt-8 text-[26px] font-extrabold leading-tight md:mt-14 md:text-[36px]">
            {LAUNCH.signup ? "Create a free account and try a Full Mock today" : "Join the Railway Psycho Test Portal"}
          </h1>
          <p className="mt-2 text-[15px] text-[#c9d3e6]" lang="hi">{LAUNCH.signup ? "फ्री अकाउंट बनाएँ और आज ही एक फुल मॉक टेस्ट दें" : "रेलवे साइको टेस्ट पोर्टल से जुड़ें"}</p>
          <ul className="mt-6 hidden space-y-2 text-[14px] text-[#e6ebf5] md:block">
            <li>✓ All 5 tests of the CBAT, hall order, real timing</li>
            <li>✓ Instant T-Score, the way the railway scores</li>
            <li>✓ Sectional, Full Mock or Combo package</li>
            <li>✓ Hindi + English</li>
          </ul>
        </div>
        <p className="relative mt-6 hidden text-[12px] text-[#9fb0d4] md:block">
          Kautilya Classes student? Your login comes from the office. <Link href="/login" className="underline hover:text-white">Sign in →</Link>
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg sm:p-8">
            <h2 className="text-[22px] font-extrabold text-gray-900">{LAUNCH.signup ? "Create account" : "Get your login"}</h2>
            <p className="mt-1 text-[13px] text-gray-600">
              Your mobile number is your login ID.
              <span className="block" lang="hi">आपका मोबाइल नंबर ही लॉगिन ID है।</span>
            </p>
            <div className="mt-6">
              {!LAUNCH.signup ? (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-[14px] text-amber-900">
                  <p className="font-bold">Accounts are issued by Kautilya Classes.</p>
                  <p className="mt-1">Message our team on WhatsApp with your name and mobile number; your login and package are set up the same day.</p>
                  <p className="mt-1 text-[13px]" lang="hi">WhatsApp पर नाम और मोबाइल नंबर भेजें, उसी दिन लॉगिन चालू।</p>
                  <a href={CONTACT.whatsapp} className="mt-4 inline-block rounded-md bg-green-600 px-5 py-2.5 text-[14px] font-bold text-white hover:bg-green-700">Message our team on WhatsApp</a>
                </div>
              ) : isConfigured() ? (
                <SignUpForm next={target} />
              ) : (
                <p className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">Sign-up is not configured yet.</p>
              )}
            </div>
          </div>
          <p className="mt-5 text-center text-[13px] text-gray-600">
            Already have an account? <Link href="/login" className="font-semibold text-[#0d2a6b] underline">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
