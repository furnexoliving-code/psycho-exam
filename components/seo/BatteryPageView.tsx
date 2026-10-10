import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/landing/LandingPage";
import { FreeMockCta } from "@/components/FreeMockCta";
import { Crumbs, Eyebrow, FaqList, H2, HindiSummary, JoinBand, LinkCards, Mistakes, PlanRows, Sidebar, Stat, Steps, Tips } from "@/components/seo/parts";
import { BATTERY_PAGES, DEVICE_TIP, LAST_EXAM_LABEL, STANDARD_FAQ, batteryUrl, hallOf, kindUrl, kindsOfBattery, lastExamGave, type BatteryPage } from "@/lib/seo/content";
import type { Package } from "@/lib/packages";

/**
 * One test's (battery's) public page: what the battery measures, the kinds
 * of question the hall can give for it with each one's count and clock,
 * how the screen runs, the method, tips, mistakes, a week's plan, FAQ, a
 * Hindi summary, and the way in.
 */
export function BatteryPageView({ page, packages }: { page: BatteryPage; packages: Package[] }) {
  const kinds = kindsOfBattery(page.battery);
  const others = BATTERY_PAGES.filter((b) => b.battery !== page.battery);
  const faq = [...page.faq, ...STANDARD_FAQ];
  const questions = kinds.map((k) => hallOf(k).questions);
  const minutes = kinds.map((k) => hallOf(k).timeMin);
  const range = (xs: number[]) => (Math.min(...xs) === Math.max(...xs) ? String(xs[0]) : `${Math.min(...xs)} to ${Math.max(...xs)}`);
  return (
    <div className="bg-white text-gray-900">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        <Crumbs items={[{ href: "/", label: "Home" }, { href: "/rrb-alp-psycho-test", label: "RRB ALP Psycho Test" }, { label: `Test ${page.battery} · ${page.name}` }]} />

        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_340px]">
          <article className="min-w-0">
            <Eyebrow>Test {page.battery} of 5 · RRB ALP CBAT</Eyebrow>
            <h1 className="mt-2 text-[32px] font-extrabold leading-[1.15] sm:text-[40px]">
              {page.name} <span className="block text-[20px] font-semibold text-gray-500" lang="hi">{page.hindi}</span>
            </h1>
            {page.intro.map((p) => (
              <p key={p.slice(0, 40)} className="mt-4 text-[17px] leading-relaxed text-gray-800">{p}</p>
            ))}
            <p className="mt-3 text-[15.5px] leading-relaxed text-gray-600" lang="hi">{page.introHi}</p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <Stat big={String(kinds.length)} label="kinds of question" />
              <Stat big={range(questions)} label="questions, by kind" />
              <Stat big={`${range(minutes)} min`} label="time, by kind" />
            </div>
            <p className="mt-2 text-[12.5px] text-gray-500">The hall gives one kind for Test {page.battery}, with that kind&apos;s own count and clock (RDSO guideline, ALPs Guidelines CBT, Jan 2020). T-Score 42 or more is needed in this test, as in every test.</p>

            <div className="mt-8">
              <FreeMockCta test={page.name} />
            </div>

            <H2 id="kinds" sub="सवालों के प्रकार">The {kinds.length} kinds of question in the {page.name}</H2>
            <p className="mt-2 text-[16px] leading-relaxed text-gray-800">{page.kindsIntro}</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-[14.5px]">
                <thead>
                  <tr className="bg-[#0d2a6b] text-left text-white">
                    <th className="px-3 py-2">Code</th><th className="px-3 py-2">Kind of question</th><th className="px-3 py-2">What it asks</th><th className="px-3 py-2">Questions</th><th className="px-3 py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {kinds.map((k) => {
                    const h = hallOf(k);
                    return (
                      <tr key={k.code} className="border-b border-gray-200 even:bg-gray-50">
                        <td className="px-3 py-3 font-bold text-[#c8102e]">{k.code}{lastExamGave(k.code) && <span className="ml-1 text-[#ff9933]" title={`Given in ${LAST_EXAM_LABEL}`}>★</span>}</td>
                        <td className="px-3 py-3"><Link href={kindUrl(k)} className="font-bold text-[#0d2a6b] hover:underline">{k.name}</Link><span className="block text-[12px] text-gray-500" lang="hi">{k.hindi}</span></td>
                        <td className="px-3 py-3 text-gray-700">{h.blurb}</td>
                        <td className="px-3 py-3 tabular-nums">{h.questions}{h.questionsNote && <span className="block text-[11px] text-gray-500">{h.questionsNote}</span>}</td>
                        <td className="px-3 py-3 tabular-nums">{h.timeMin} min{h.timeNote && <span className="block text-[11px] text-gray-500">{h.timeNote}</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[12.5px] text-gray-500">★ The kind the last exam ({LAST_EXAM_LABEL}) gave for this test. Each kind has its own page with a worked example, the method and a plan.</p>

            <H2 id="pattern" sub="स्क्रीन पर कैसे चलता है">How the test runs on screen</H2>
            <Steps steps={page.how} />

            <H2 id="method" sub="तरीका">The method</H2>
            <Steps steps={page.method} tone="navy" />

            <H2 id="tips" sub="सुझाव">{page.tips.length + 1} tips that raise the score</H2>
            <Tips tips={[...page.tips, DEVICE_TIP]} />

            <H2 id="mistakes" sub="गलतियाँ">Mistakes that cost marks</H2>
            <Mistakes items={page.mistakes} />

            <H2 id="plan" sub="7 दिन की योजना">A 7-day plan for the {page.name}</H2>
            <PlanRows rows={page.plan} />

            <JoinBand test={page.name} />

            <H2 id="faq" sub="सवाल-जवाब">Questions students ask</H2>
            <FaqList items={faq} />

            <HindiSummary text={page.summaryHi} />

            <H2>The other four tests of the CBAT</H2>
            <LinkCards items={others.map((b) => ({ href: batteryUrl(b), title: `Test ${b.battery} · ${b.name}`, hindi: b.hindi, note: `${kindsOfBattery(b.battery).length} kinds of question` }))} />
            <p className="mt-6 text-[14px] text-gray-600">
              New to the exam? Start with the <Link href="/rrb-alp-psycho-test" className="font-semibold text-[#0d2a6b] hover:underline">complete guide to the RRB ALP psycho test</Link>, or see <Link href="/psycho-test" className="font-semibold text-[#0d2a6b] hover:underline">all 19 kinds of question</Link> on one page.
            </p>
          </article>

          <Sidebar packages={packages} test={page.name} />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
