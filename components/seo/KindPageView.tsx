import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/landing/LandingPage";
import { FreeMockCta } from "@/components/FreeMockCta";
import { Crumbs, Eyebrow, FaqList, H2, HindiSummary, JoinBand, LinkCards, Mistakes, PlanRows, Sidebar, Stat, Steps, Tips } from "@/components/seo/parts";
import { BATTERY_PAGES, DEVICE_TIP, LAST_EXAM_LABEL, STANDARD_FAQ, batteryPageOf, batteryUrl, hallOf, kindUrl, kindsOfBattery, lastExamGave, type KindPage } from "@/lib/seo/content";
import type { Package } from "@/lib/packages";

/**
 * One kind of question's public page: what the hall asks, the count and
 * clock, how the screen runs, the guideline's worked example, the method,
 * tips, mistakes, a week's plan, the questions people search, a Hindi
 * summary, and the way in. Everything a candidate needs before the first
 * practice paper.
 */
export function KindPageView({ page, packages }: { page: KindPage; packages: Package[] }) {
  const battery = batteryPageOf(page.battery);
  const hall = hallOf(page);
  const siblings = kindsOfBattery(page.battery).filter((k) => k.slug !== page.slug);
  const others = BATTERY_PAGES.filter((b) => b.battery !== page.battery);
  const faq = [...page.faq, ...STANDARD_FAQ];
  const last = lastExamGave(page.code);
  return (
    <div className="bg-white text-gray-900">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        <Crumbs items={[{ href: "/", label: "Home" }, { href: "/rrb-alp-psycho-test", label: "RRB ALP Psycho Test" }, { href: batteryUrl(battery), label: `Test ${battery.battery} · ${battery.name}` }, { label: page.name }]} />

        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_340px]">
          <article className="min-w-0">
            <Eyebrow>{page.code} · Test {page.battery} · {battery.name} · RRB ALP CBAT</Eyebrow>
            <h1 className="mt-2 text-[32px] font-extrabold leading-[1.15] sm:text-[40px]">
              {page.name} <span className="block text-[20px] font-semibold text-gray-500" lang="hi">{page.hindi}</span>
            </h1>
            {last && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#ff9933] bg-[#fff7ee] px-3 py-1 text-[12.5px] font-semibold text-gray-800">
                <span aria-hidden="true">★</span> The last exam ({LAST_EXAM_LABEL}) gave this kind for Test {page.battery}
              </p>
            )}
            {page.intro.map((p) => (
              <p key={p.slice(0, 40)} className="mt-4 text-[17px] leading-relaxed text-gray-800">{p}</p>
            ))}
            <p className="mt-3 text-[15.5px] leading-relaxed text-gray-600" lang="hi">{page.introHi}</p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <Stat big={String(hall.questions)} label={hall.questionsNote ? `questions (${hall.questionsNote})` : "questions"} />
              <Stat big={`${hall.timeMin} min`} label={hall.timeNote ? `time (${hall.timeNote})` : "time limit"} />
              <Stat big="42" label="T-Score to pass" />
            </div>
            <p className="mt-2 text-[12.5px] text-gray-500">The hall&apos;s own count and clock, as the RDSO guideline (ALPs Guidelines CBT, Jan 2020) gives them. {page.answerStyle}</p>

            <div className="mt-8">
              <FreeMockCta test={battery.name} />
            </div>

            <H2 id="pattern" sub="स्क्रीन पर कैसे चलता है">How the test runs on screen</H2>
            <Steps steps={page.how} />

            <H2 id="example" sub="उदाहरण">A worked example</H2>
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-5">
              <ul className="space-y-1.5 text-[16px] text-gray-800">
                {page.example.lines.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
              <p className="mt-3 text-[15px] font-semibold text-[#0d2a6b]">{page.example.answer}</p>
            </div>

            <H2 id="method" sub="तरीका">The method: how to attempt a question</H2>
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

            <H2>The other kinds of {battery.name}</H2>
            <p className="mt-1 text-[14px] text-gray-600">The hall gives one of them for Test {page.battery}; practise them all.</p>
            <LinkCards items={siblings.map((s) => ({ href: kindUrl(s), title: `${s.code} · ${s.name}`, hindi: s.hindi, note: `${hallOf(s).questions} questions · ${hallOf(s).timeMin} min` }))} />

            <H2>The other four tests of the CBAT</H2>
            <LinkCards items={others.map((b) => ({ href: batteryUrl(b), title: `Test ${b.battery} · ${b.name}`, hindi: b.hindi, note: `${kindsOfBattery(b.battery).length} kinds of question` }))} />
            <p className="mt-6 text-[14px] text-gray-600">
              New to the exam? Start with the <Link href="/rrb-alp-psycho-test" className="font-semibold text-[#0d2a6b] hover:underline">complete guide to the RRB ALP psycho test</Link>, or see <Link href="/psycho-test" className="font-semibold text-[#0d2a6b] hover:underline">all 19 kinds of question</Link> on one page.
            </p>
          </article>

          <Sidebar packages={packages} test={battery.name} />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
