import type { Metadata } from "next";
import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/landing/LandingPage";
import { SampleTest } from "@/components/demo/SampleTest";

export const metadata: Metadata = {
  title: "Free RRB ALP Psycho Test Sample Online, No Login | Kautilya Classes",
  description: "Try the RRB ALP psycho test (CBAT) free in two minutes: a short Memory Test and a Perceptual Speed Test on a screen like the exam hall, scored at once. No login. Then sit a full free mock.",
  keywords: ["free psycho test online", "ALP psycho test sample", "RRB ALP CBAT demo", "psycho test practice free", "memory test online free"],
  robots: { index: true, follow: true },
  alternates: { canonical: "https://kautilyaonline.com/demo" },
  openGraph: { title: "Free RRB ALP psycho test sample, no login", description: "Two minutes on a screen like the exam hall, scored at once.", url: "https://kautilyaonline.com/demo", images: [{ url: "/og.jpg" }] },
};

export default async function DemoPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const initial = t === "memory" || t === "speed" ? t : null;
  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6fb] text-gray-900">
      <PublicHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-8 md:py-12">
        <p className="text-[12px] font-bold uppercase tracking-[0.25em] text-[#c8102e]">Free sample · कोई लॉगिन नहीं</p>
        <h1 className="mt-2 text-[30px] font-extrabold sm:text-[38px]">Try the railway psycho test in 2 minutes</h1>
        <p className="mt-2 text-[15px] text-gray-600">
          A short Memory Test and a short Perceptual Speed Test, on a screen laid out like the exam hall, scored the moment you finish. No account, nothing to install.
          <span className="block text-[14px] text-gray-500" lang="hi">छोटा मेमोरी टेस्ट और स्पीड टेस्ट, परीक्षा हॉल जैसी स्क्रीन पर, तुरंत रिज़ल्ट। बिना अकाउंट।</span>
        </p>
        <div className="mt-6">
          <SampleTest initial={initial} />
        </div>
        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            ["This sample", "A taste: a few questions, your own clock, scored in the browser."],
            ["The free Full Mock", "All 5 tests in one sitting with the real timing and your T-Score. Needs a free account."],
            ["A package", "Every practice paper of the 5 tests and every Full Mock, with Today's plan on the dashboard."],
          ].map(([h, p], i) => (
            <div key={h} className={`rounded-xl border p-5 ${i === 1 ? "border-green-400 bg-green-50" : "border-gray-200 bg-white"}`}>
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Step {i + 1}</div>
              <h2 className="mt-1 text-[17px] font-bold text-gray-900">{h}</h2>
              <p className="mt-1 text-[13px] text-gray-700">{p}</p>
            </div>
          ))}
        </section>
        <p className="mt-6 text-[14px] text-gray-700">
          Read how each test works: <Link href="/psycho-test/memory-test" className="font-semibold text-[#0d2a6b] underline">Memory</Link>,{" "}
          <Link href="/psycho-test/following-directions-test" className="font-semibold text-[#0d2a6b] underline">Following Directions</Link>,{" "}
          <Link href="/psycho-test/depth-perception-test" className="font-semibold text-[#0d2a6b] underline">Depth Perception</Link>,{" "}
          <Link href="/psycho-test/power-of-observation-test" className="font-semibold text-[#0d2a6b] underline">Power of Observation</Link>,{" "}
          <Link href="/psycho-test/perceptual-speed-test" className="font-semibold text-[#0d2a6b] underline">Perceptual Speed</Link>, or the{" "}
          <Link href="/rrb-alp-psycho-test" className="font-semibold text-[#0d2a6b] underline">complete ALP psycho test guide</Link>.
        </p>
      </main>
      <PublicFooter />
    </div>
  );
}
