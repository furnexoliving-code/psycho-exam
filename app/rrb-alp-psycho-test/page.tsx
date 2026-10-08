import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/landing/LandingPage";
import plan from "@/public/landing/plan.jpg";
import { listPackages } from "@/lib/packages";
import { KIND_LABEL, rupees } from "@/lib/packages";
import { TEST_PAGES } from "@/lib/seo-tests";

const SITE = "https://kautilyaonline.com";
const Y = "#ff9933";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "RRB ALP Psycho Test 2026 (CBAT): 5 tests, T-Score 42, pattern, practice",
  description: "Complete guide to the RRB ALP Computer Based Aptitude Test: the five tests in the hall's order, questions and time for each, the T-Score 42 rule, 30% weight in merit, how to prepare, and free practice on a screen like the exam.",
  keywords: ["RRB ALP psycho test", "ALP CBAT 2026", "computer based aptitude test ALP", "ALP psycho test pattern", "T-score 42 ALP", "ALP psycho test practice online", "RDSO psycho test"],
  robots: { index: true, follow: true },
  alternates: { canonical: `${SITE}/rrb-alp-psycho-test` },
  openGraph: { type: "article", url: `${SITE}/rrb-alp-psycho-test`, title: "RRB ALP Psycho Test (CBAT): the complete guide", description: "Five tests, T-Score 42 in each, 30% of the final merit. Pattern, tips and free practice.", images: [{ url: "/og.jpg" }], locale: "en_IN" },
};

const FAQ = [
  { q: "What is the RRB ALP psycho test?", a: "The Computer Based Aptitude Test (CBAT), taken after CBT 2 by candidates shortlisted for Assistant Loco Pilot. It is conducted on the RDSO pattern and has five test batteries: Memory, Following Directions, Depth Perception, Power of Observation and Perceptual Speed." },
  { q: "What is the qualifying score?", a: "A T-Score of at least 42 in every one of the five tests. A candidate below 42 in any single test does not qualify, whatever the CBT 2 marks." },
  { q: "How much does the CBAT count in the final merit?", a: "30%. The final merit for ALP is 70% CBT 2 Part A plus 30% CBAT." },
  { q: "Is there negative marking in the CBAT?", a: "No. Attempt every question in every test." },
  { q: "What language is the test in?", a: "Hindi and English together, on the instruction screens and the questions." },
  { q: "How should I prepare?", a: "Practise on a screen that works like the hall: each test with its own instruction screen and clock, in the hall's order. Start with a free Full Mock to find the weak tests, practise those daily until every test is at T-Score 42 or more, then rehearse with Full Mocks." },
  { q: "Can I practise free?", a: "Yes. The two-minute sample on this site needs no login, and every free account on kautilyaonline.com gets one Full Mock with all five tests." },
];

export default async function AlpGuidePage() {
  const packages = await listPackages("alp");
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: metadata.title,
      description: metadata.description,
      author: { "@type": "Organization", name: "Kautilya Classes" },
      publisher: { "@type": "Organization", name: "Kautilya Classes", logo: { "@type": "ImageObject", url: `${SITE}/kautilya-logo.png` } },
      mainEntityOfPage: `${SITE}/rrb-alp-psycho-test`,
    },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  ];
  return (
    <div className="bg-white text-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        <nav aria-label="Breadcrumb" className="text-[12px] text-gray-500"><Link href="/" className="hover:underline">Home</Link> › <span className="text-gray-700">RRB ALP Psycho Test</span></nav>
        <p className="mt-6 text-[12px] font-bold uppercase tracking-[0.25em] text-[#c8102e]">Complete guide · पूरी जानकारी</p>
        <h1 className="mt-2 text-[32px] font-extrabold leading-[1.15] sm:text-[42px]">RRB ALP Psycho Test (CBAT): the five tests, the T-Score 42 rule, and how to prepare</h1>
        <p className="mt-4 max-w-3xl text-[17px] leading-relaxed text-gray-800">
          After CBT 2, every Assistant Loco Pilot candidate sits the Computer Based Aptitude Test, conducted on the RDSO pattern. It is a qualifying test with five batteries. You need a <b>T-Score of 42 or more in every one</b>, and the CBAT carries <b>30% of the final merit</b> (CBT 2 carries 70%). Most candidates meet the real screen for the first time in the hall; this page, and the free practice on this site, change that.
        </p>
        <p className="mt-2 max-w-3xl text-[15px] text-gray-600" lang="hi">CBT 2 के बाद हर ALP उम्मीदवार को CBAT (साइको टेस्ट) देना होता है। पाँच टेस्ट, हर एक में T-Score 42 ज़रूरी, और फाइनल मेरिट में 30% वज़न।</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[["5", "tests, in the hall's order"], ["42", "T-Score needed in each"], ["30%", "of the final ALP merit"], ["0", "negative marking"]].map(([b, l]) => (
            <div key={l} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"><div className="text-[28px] font-extrabold text-[#0d2a6b]">{b}</div><div className="text-[12px] text-gray-600">{l}</div></div>
          ))}
        </div>

        <h2 className="mt-12 text-[26px] font-extrabold">The five tests</h2>
        <p className="mt-1 text-[15px] text-gray-600">Questions and time as the portal's Full Mock runs each test, set to the RDSO pattern. Click a test for its pattern, tips and sample.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr className="bg-[#0d2a6b] text-left text-white">
                <th className="px-3 py-2">#</th><th className="px-3 py-2">Test</th><th className="px-3 py-2">What it asks</th><th className="px-3 py-2">Questions</th><th className="px-3 py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {TEST_PAGES.map((t) => (
                <tr key={t.slug} className="border-b border-gray-200 even:bg-gray-50">
                  <td className="px-3 py-3 font-bold text-[#c8102e]">{t.battery}</td>
                  <td className="px-3 py-3"><Link href={`/psycho-test/${t.slug}`} className="font-bold text-[#0d2a6b] hover:underline">{t.name}</Link><span className="block text-[12px] text-gray-500" lang="hi">{t.hindi}</span></td>
                  <td className="px-3 py-3 text-gray-700">{t.what.split(". ")[0]}.</td>
                  <td className="px-3 py-3 tabular-nums">{t.questions}</td>
                  <td className="px-3 py-3 tabular-nums">{t.minutes} min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[13px] text-gray-500">Each test has a 5-minute instruction screen in Hindi and English, its own clock, and a short break before the next.</p>

        <h2 className="mt-12 text-[26px] font-extrabold">What T-Score 42 means</h2>
        <p className="mt-2 max-w-3xl text-[16px] leading-relaxed text-gray-800">A T-Score compares your marks with everyone who took the same paper: 50 is the average, each 10 points is one standard deviation. 42 is a little below the average candidate; 60 is comfortably above. The railway needs 42 in every test. The portal scores every paper the same way, so the number you see in practice is the number that matters in the hall.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[["Below 42", "Not qualified", "#C62828"], ["42 to 59", "Passed", "#B7791F"], ["60 and above", "Our target", "#1E8C5A"]].map(([r, l, c]) => (
            <div key={r} className="rounded-xl border-l-4 bg-gray-50 p-4" style={{ borderColor: c }}><div className="text-[12px] font-bold uppercase tracking-wider" style={{ color: c }}>{l}</div><div className="text-[24px] font-extrabold" style={{ color: c }}>{r}</div></div>
          ))}
        </div>

        <h2 className="mt-12 text-[26px] font-extrabold">How to prepare in 30 days</h2>
        <div className="mt-4 grid gap-6 md:grid-cols-[1fr_1fr] md:items-center">
          <ol className="space-y-3">
            {[
              ["Days 1 to 3", "Sit the free Full Mock. It shows your T-Score in each of the five tests: the weak ones are now known, not guessed."],
              ["Days 4 to 20", "Practise the weakest two tests daily, two or three papers each. The dashboard's Today's plan names the paper to open. Aim: every test at 42 or more."],
              ["Days 21 to 30", "A Full Mock every second day, in the hall's order, with the real timing. Review every wrong question. Aim: 60 in every test."],
            ].map(([h, p], i) => (
              <li key={h} className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-[#0d2a6b]" style={{ background: Y }}>{i + 1}</span><div><div className="text-[15px] font-bold">{h}</div><p className="text-[14px] text-gray-700">{p}</p></div></li>
            ))}
          </ol>
          <Image src={plan} alt="The portal's dashboard with Today's plan: the weakest test first and the paper to open" className="rounded-xl border border-gray-200 shadow" sizes="(min-width: 768px) 560px, 100vw" />
        </div>

        <h2 className="mt-12 text-[26px] font-extrabold">Practise on the real screen</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border-2 border-dashed border-green-400 bg-green-50 p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-green-700">Free</p>
            <h3 className="mt-1 text-[18px] font-extrabold">2-minute sample, no login</h3>
            <Link href="/demo" className="mt-3 inline-block rounded-md bg-green-600 px-4 py-2 text-[13px] font-bold text-white">Try now →</Link>
          </div>
          <div className="rounded-xl border-2 border-dashed border-green-400 bg-green-50 p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-green-700">Free</p>
            <h3 className="mt-1 text-[18px] font-extrabold">1 Full Mock, all 5 tests</h3>
            <Link href="/signup" className="mt-3 inline-block rounded-md bg-green-600 px-4 py-2 text-[13px] font-bold text-white">Create free account →</Link>
          </div>
          {packages.map((p) => (
            <div key={p.id} className={`rounded-xl border bg-white p-5 ${p.kind === "combo" ? "border-[#0d2a6b] shadow-md" : "border-gray-200"}`}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#c8102e]">{KIND_LABEL[p.kind]}</p>
              <h3 className="mt-1 text-[16px] font-extrabold leading-tight">{p.name}</h3>
              <div className="mt-2 text-[24px] font-extrabold text-[#0d2a6b]">{rupees(p.priceInr)}</div>
              <Link href="/packages" className="mt-2 inline-block text-[13px] font-bold text-[#0d2a6b] underline">See package →</Link>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-[26px] font-extrabold">Questions students ask</h2>
        <div className="mt-3 divide-y divide-gray-200 rounded-xl border border-gray-200">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="cursor-pointer list-none text-[16px] font-semibold marker:content-none"><span className="mr-2 inline-block text-[#0d2a6b] transition group-open:rotate-90">▸</span>{f.q}</summary>
              <p className="mt-2 pl-6 text-[15px] leading-relaxed text-gray-700">{f.a}</p>
            </details>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
