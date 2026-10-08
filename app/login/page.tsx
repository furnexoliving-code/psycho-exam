import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile, isConfigured } from "@/lib/auth";
import { AuthForm } from "./AuthForm";
import { SetupNotice } from "./SetupNotice";

export const metadata: Metadata = {
  title: "Student Login | Kautilya Classes Railway Psycho Test Portal",
  description: "Sign in to the Kautilya Classes Railway Psycho Test Portal with your registered mobile number.",
};

/**
 * Where to go after signing in. Only a path on this site is honoured: the
 * value comes off the URL, and a link that reads
 * /login?next=https://elsewhere would otherwise send a freshly signed-in
 * student anywhere at all.
 */
function safeNext(next: string | undefined): string {
  if (!next || !next.startsWith("/")) return "/dashboard";
  // Judged by the same parser the browser uses, so every spelling of "another
  // site" — //evil.com, /\evil.com, a tab or newline before the host — is
  // caught by the one rule: it must resolve to THIS origin.
  try {
    const url = new URL(next, "http://x");
    if (url.origin !== "http://x") return "/dashboard";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/dashboard";
  }
}

const Y = "#ff9933";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const target = safeNext(next);

  // Already signed in: there is nothing to do here.
  if (isConfigured() && (await getProfile())) redirect(target);

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6fb] md:flex-row">
      {/* Brand panel */}
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
            Practice the RRB ALP psycho test on the real exam screen
          </h1>
          <p className="mt-2 text-[15px] text-[#c9d3e6]" lang="hi">असली परीक्षा जैसी स्क्रीन पर रेलवे साइको टेस्ट की तैयारी</p>
          <ul className="mt-6 hidden space-y-2 text-[14px] text-[#e6ebf5] md:block">
            <li>✓ All 5 tests of the CBAT, as per RDSO pattern</li>
            <li>✓ Full Mock Tests with the hall&apos;s timing and breaks</li>
            <li>✓ Instant T-Score and a daily plan</li>
            <li>✓ Hindi + English</li>
          </ul>
        </div>
        <p className="relative mt-6 hidden text-[12px] text-[#9fb0d4] md:block">
          New here? <Link href="/" className="underline hover:text-white">See how the portal works →</Link>
        </p>
      </aside>

      {/* Form */}
      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg sm:p-8">
            <h2 className="text-[22px] font-extrabold text-gray-900">Student Login</h2>
            <p className="mt-1 text-[13px] text-gray-600">
              Sign in with the mobile number registered with the institute.
              <span className="block" lang="hi">संस्थान में दर्ज मोबाइल नंबर से साइन इन करें।</span>
            </p>

            {error === "inactive" && (
              <p role="alert" className="mt-5 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
                This account has been switched off by the institute. Ask at the institute if you think that is a mistake.
              </p>
            )}

            {error === "elsewhere" && (
              <p role="alert" className="mt-5 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
                This account was signed in on another device, so this one was signed out. One device at a time; sign in again here to continue on this one.
                <span className="mt-1 block" lang="hi">यह खाता दूसरे डिवाइस पर साइन इन हुआ, इसलिए यहाँ से साइन आउट हो गया। एक समय पर एक ही डिवाइस; यहाँ जारी रखने के लिए फिर साइन इन करें।</span>
              </p>
            )}

            <div className="mt-6">{isConfigured() ? <AuthForm next={target} /> : <SetupNotice />}</div>
          </div>

          <p className="mt-5 text-center text-[14px] text-gray-700">
            New here? <Link href="/signup" className="font-bold text-[#0d2a6b] underline">Create a free account</Link>
            <span className="block text-[12px] text-gray-500" lang="hi">नए हैं? फ्री अकाउंट बनाएँ।</span>
          </p>
          <p className="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-[12px] text-gray-600">
            Kautilya Classes student? Your login is issued by the institute: ask at the office for your mobile number and password.
            <span className="mt-1 block" lang="hi">कौटिल्य क्लासेज़ के छात्र हैं? आपका लॉगिन संस्थान देता है।</span>
          </p>
          <p className="mt-4 text-center text-[12px] text-gray-500 md:hidden">
            <Link href="/" className="underline">See how the portal works →</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
