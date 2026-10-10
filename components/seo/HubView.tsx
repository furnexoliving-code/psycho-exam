import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/landing/LandingPage";
import { FreeMockCta } from "@/components/FreeMockCta";
import { Crumbs, Eyebrow, H2, Sidebar } from "@/components/seo/parts";
import { BATTERY_PAGES, LAST_EXAM_LABEL, batteryUrl, hallOf, kindUrl, kindsOfBattery, lastExamGave } from "@/lib/seo/content";
import type { Package } from "@/lib/packages";

/** Every kind of question of the CBAT on one page, test by test: the index the search engines and the students both want. */
export function HubView({ packages }: { packages: Package[] }) {
  return (
    <div className="bg-white text-gray-900">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        <Crumbs items={[{ href: "/", label: "Home" }, { href: "/rrb-alp-psycho-test", label: "RRB ALP Psycho Test" }, { label: "All 19 kinds of question" }]} />
        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_340px]">
          <article className="min-w-0">
            <Eyebrow>RRB ALP CBAT · 5 tests · 19 kinds of question</Eyebrow>
            <h1 className="mt-2 text-[32px] font-extrabold leading-[1.15] sm:text-[40px]">
              Every kind of question in the RRB ALP psycho test <span className="block text-[20px] font-semibold text-gray-500" lang="hi">ALP साइको टेस्ट के सभी 19 प्रकार के सवाल</span>
            </h1>
            <p className="mt-4 text-[17px] leading-relaxed text-gray-800">
              The CBAT has five tests, and the hall gives each test as one of its kinds of question: five kinds for the Memory Test, three for Following Directions, two for Depth Perception, four for Power of Observation and five for Perceptual Speed. You do not know in advance which kind you will get, so every kind must be practised. Each page below gives the hall&apos;s count and clock for that kind, a worked example from the RDSO guideline, the method, tips, mistakes and a 7-day plan.
            </p>
            <p className="mt-3 text-[15.5px] text-gray-600" lang="hi">परीक्षा हॉल में हर टेस्ट किसी एक प्रकार में आता है, और पहले से पता नहीं होता कौन सा। इसलिए हर प्रकार का अभ्यास ज़रूरी है। ★ वाला प्रकार पिछली परीक्षा ({LAST_EXAM_LABEL}) में आया था।</p>

            <div className="mt-8">
              <FreeMockCta />
            </div>

            {BATTERY_PAGES.map((b) => (
              <section key={b.slug}>
                <H2 id={b.slug} sub={b.hindi}>
                  <Link href={batteryUrl(b)} className="hover:underline">Test {b.battery} · {b.name}</Link>
                </H2>
                <p className="mt-1 text-[14px] text-gray-600">{b.intro[0]}</p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {kindsOfBattery(b.battery).map((k) => {
                    const h = hallOf(k);
                    return (
                      <li key={k.code} className="rounded-xl border border-gray-200 p-4 transition hover:border-[#0d2a6b] hover:shadow-md">
                        <Link href={kindUrl(k)} className="text-[15.5px] font-bold text-[#0d2a6b] hover:underline">{k.code} · {k.name}</Link>
                        {lastExamGave(k.code) && <span className="ml-2 rounded-full border border-[#ff9933] bg-[#fff7ee] px-2 py-0.5 text-[10.5px] font-bold text-gray-800">★ {LAST_EXAM_LABEL}</span>}
                        <p className="text-[12px] text-gray-500" lang="hi">{k.hindi}</p>
                        <p className="mt-1 text-[13px] text-gray-700">{h.blurb}</p>
                        <p className="mt-1 text-[12.5px] text-gray-500">{h.questions} questions{h.questionsNote ? ` (${h.questionsNote})` : ""} · {h.timeMin} min{h.timeNote ? ` (${h.timeNote})` : ""}</p>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}

            <p className="mt-10 text-[14px] text-gray-600">
              Read the <Link href="/rrb-alp-psycho-test" className="font-semibold text-[#0d2a6b] hover:underline">complete guide to the RRB ALP psycho test</Link> for the T-Score 42 rule, the merit weight and the 30-day plan.
            </p>
          </article>
          <Sidebar packages={packages} />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
