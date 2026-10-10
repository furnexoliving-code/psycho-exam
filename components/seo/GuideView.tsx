import Image from "next/image";
import Link from "next/link";
import plan from "@/public/landing/plan.jpg";
import { PublicFooter, PublicHeader } from "@/components/landing/LandingPage";
import { FreeMockCta } from "@/components/FreeMockCta";
import { Crumbs, Eyebrow, FaqList, H2, HindiSummary, PlanTable, Sidebar, Y } from "@/components/seo/parts";
import { BATTERY_PAGES, LAST_EXAM_LABEL, batteryUrl, hallOf, kindUrl, kindsOfBattery, lastExamGave, type GuidePage } from "@/lib/seo/content";
import type { Package } from "@/lib/packages";

/** The complete guide to the exam: the hub every test page links back to. */
export function GuideView({ page, packages }: { page: GuidePage; packages: Package[] }) {
  return (
    <div className="bg-white text-gray-900">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        <Crumbs items={[{ href: "/", label: "Home" }, { label: "RRB ALP Psycho Test" }]} />
        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_340px]">
          <article className="min-w-0">
            <Eyebrow>Complete guide · पूरी जानकारी</Eyebrow>
            <h1 className="mt-2 text-[32px] font-extrabold leading-[1.15] sm:text-[42px]">RRB ALP Psycho Test (CBAT): the five tests, the T-Score 42 rule, and how to prepare</h1>
            {page.intro.map((p) => (
              <p key={p.slice(0, 40)} className="mt-4 text-[17px] leading-relaxed text-gray-800">{p}</p>
            ))}
            <p className="mt-3 text-[15.5px] leading-relaxed text-gray-600" lang="hi">{page.introHi}</p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[["5", "tests, in the hall's order"], ["42", "T-Score needed in each"], ["30%", "of the final ALP merit"], ["0", "negative marking"]].map(([b, l]) => (
                <div key={l} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"><div className="text-[28px] font-extrabold text-[#0d2a6b]">{b}</div><div className="text-[12px] text-gray-600">{l}</div></div>
              ))}
            </div>

            <div className="mt-8">
              <FreeMockCta />
            </div>

            <H2 id="tests" sub="पाँच टेस्ट">The five tests and their 19 kinds of question</H2>
            <p className="mt-2 text-[15px] text-gray-600">The hall gives one kind of question for each test, with that kind&apos;s own count and clock. ★ marks the kind the last exam ({LAST_EXAM_LABEL}) gave. Click a test or a kind for its pattern, a worked example, the method and tips.</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-[14px]">
                <thead>
                  <tr className="bg-[#0d2a6b] text-left text-white">
                    <th className="px-3 py-2">#</th><th className="px-3 py-2">Test</th><th className="px-3 py-2">Kinds of question (questions · minutes)</th>
                  </tr>
                </thead>
                <tbody>
                  {BATTERY_PAGES.map((b) => (
                    <tr key={b.slug} className="border-b border-gray-200 align-top even:bg-gray-50">
                      <td className="px-3 py-3 font-bold text-[#c8102e]">{b.battery}</td>
                      <td className="px-3 py-3">
                        <Link href={batteryUrl(b)} className="font-bold text-[#0d2a6b] hover:underline">{b.name}</Link>
                        <span className="block text-[12px] text-gray-500" lang="hi">{b.hindi}</span>
                      </td>
                      <td className="px-3 py-3 text-gray-700">
                        <ul className="space-y-1">
                          {kindsOfBattery(b.battery).map((k) => {
                            const h = hallOf(k);
                            return (
                              <li key={k.code}>
                                <Link href={kindUrl(k)} className="font-semibold text-[#0d2a6b] hover:underline">{k.code} {k.name}</Link>{lastExamGave(k.code) && <span className="ml-1 text-[#ff9933]">★</span>}
                                <span className="text-gray-500"> · {h.questions} · {h.timeMin} min</span>
                              </li>
                            );
                          })}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {page.sections.map((s) => (
              <section key={s.h}>
                <H2>{s.h}</H2>
                {s.paragraphs.map((p) => (
                  <p key={p.slice(0, 40)} className="mt-3 max-w-3xl text-[16px] leading-relaxed text-gray-800">{p}</p>
                ))}
              </section>
            ))}

            <H2 id="tscore" sub="T-Score का मतलब">What T-Score 42 means on the portal</H2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[["Below 42", "Not qualified", "#C62828"], ["42 to 59", "Passed", "#B7791F"], ["60 and above", "Our target", "#1E8C5A"]].map(([r, l, c]) => (
                <div key={r} className="rounded-xl border-l-4 bg-gray-50 p-4" style={{ borderColor: c }}><div className="text-[12px] font-bold uppercase tracking-wider" style={{ color: c }}>{l}</div><div className="text-[24px] font-extrabold" style={{ color: c }}>{r}</div></div>
              ))}
            </div>
            <p className="mt-3 text-[15px] text-gray-700">The portal scores every paper the same way the railway does, against everyone who sat it, so the number you see in practice is the number that matters in the hall.</p>

            <H2 id="plan" sub="30 दिन की योजना">The 30-day plan</H2>
            <div className="mt-4 grid gap-6 md:grid-cols-[1fr_1fr] md:items-start">
              <PlanTable rows={page.plan30} first="Days" />
              <Image src={plan} alt="The portal's dashboard with Today's plan: the weakest test first and the paper to open" className="rounded-xl border border-gray-200 shadow" sizes="(min-width: 768px) 480px, 100vw" />
            </div>

            <aside className="mt-12 rounded-2xl bg-[#0d2a6b] px-6 py-6 text-white">
              <p className="text-[12px] font-bold uppercase tracking-[0.22em]" style={{ color: Y }}>Practise on the real screen</p>
              <h2 className="mt-1 text-[24px] font-extrabold leading-tight">Every kind of question, with the hall&apos;s count and clock, and your T-Score at once</h2>
              <p className="mt-1 text-[15px] text-[#c9d3e6]">Practice papers of all 19 kinds, up to 3 attempts each, review with the correct answers, and Full Mocks with all 5 tests in the hall&apos;s order.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/packages" className="rounded-md px-5 py-2.5 text-[14px] font-bold text-[#0d2a6b]" style={{ background: Y }}>Packages &amp; prices</Link>
                <Link href="/psycho-test" className="rounded-md border border-white/40 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-white/10">All 19 kinds of question →</Link>
              </div>
            </aside>

            <H2 id="faq" sub="सवाल-जवाब">Questions students ask</H2>
            <FaqList items={page.faq} />

            <HindiSummary text={page.summaryHi} />
          </article>
          <Sidebar packages={packages} laptop={false} />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
