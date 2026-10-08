import Image from "next/image";
import Link from "next/link";
import { CONTACT, PublicFooter, PublicHeader } from "@/components/landing/LandingPage";
import exam from "@/public/landing/exam.jpg";
import { TEST_PAGES, type TestPage } from "@/lib/seo-tests";
import { KIND_LABEL, rupees, type Package } from "@/lib/packages";

const Y = "#ff9933";

/** One test's public page: what it asks, how the screen runs, tips, FAQ, and the way in. */
export function TestPageView({ page, packages }: { page: TestPage; packages: Package[] }) {
  const others = TEST_PAGES.filter((t) => t.slug !== page.slug);
  const combo = packages.find((p) => p.kind === "combo") ?? null;
  const sectional = packages.find((p) => p.kind === "sectional") ?? null;
  const side = [combo, sectional].filter((p): p is Package => Boolean(p));
  return (
    <div className="bg-white text-gray-900">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        <nav aria-label="Breadcrumb" className="text-[12px] text-gray-500">
          <Link href="/" className="hover:underline">Home</Link> › <Link href="/rrb-alp-psycho-test" className="hover:underline">RRB ALP Psycho Test</Link> › <span className="text-gray-700">{page.name}</span>
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_340px]">
          <article className="min-w-0">
            <p className="text-[12px] font-bold uppercase tracking-[0.25em] text-[#c8102e]">Test {page.battery} of 5 · RRB ALP CBAT</p>
            <h1 className="mt-2 text-[32px] font-extrabold leading-[1.15] sm:text-[40px]">
              {page.name} <span className="block text-[20px] font-semibold text-gray-500" lang="hi">{page.hindi}</span>
            </h1>
            <p className="mt-4 text-[17px] leading-relaxed text-gray-800">{page.what}</p>
            <p className="mt-2 text-[15px] text-gray-600" lang="hi">{page.whatHi}</p>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <Stat big={String(page.questions)} label="questions" />
              <Stat big={`${page.minutes} min`} label="time limit" />
              <Stat big="42" label="T-Score to pass" />
            </div>
            <p className="mt-2 text-[12px] text-gray-500">As the portal's Full Mock runs this test, set to the RDSO pattern; the institute updates it if the pattern changes.</p>

            {page.image && (
              <Image src={exam} alt={`The ${page.name} on the portal's exam screen`} className="mt-6 rounded-xl border border-gray-200 shadow" sizes="(min-width: 1024px) 760px, 100vw" />
            )}

            <h2 className="mt-10 text-[26px] font-extrabold">How the test runs on screen</h2>
            <ol className="mt-3 space-y-3">
              {page.how.map((h, i) => (
                <li key={i} className="flex gap-3 text-[16px] leading-relaxed text-gray-800">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-[#0d2a6b]" style={{ background: Y }}>{i + 1}</span>
                  <span>{h}</span>
                </li>
              ))}
            </ol>

            {page.demo && (
              <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl border border-[#0d2a6b]/20 bg-[#eef2fb] p-5">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-gray-900">Try a 1-minute sample of this test, no login</p>
                  <p className="text-[13px] text-gray-600" lang="hi">बिना लॉगिन एक मिनट का सैंपल दें</p>
                </div>
                <Link href={`/demo?t=${page.demo}`} className="rounded-md bg-[#0d2a6b] px-5 py-2.5 text-[14px] font-bold text-white hover:bg-[#0a2158]">Start sample →</Link>
              </div>
            )}

            <h2 className="mt-10 text-[26px] font-extrabold">{page.tips.length} tips that raise the score</h2>
            <div className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-200">
              {page.tips.map((t, i) => (
                <div key={t.h} className="px-5 py-4">
                  <h3 className="text-[17px] font-bold text-gray-900"><span className="mr-2 text-[#c8102e]">{i + 1}.</span>{t.h}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-gray-700">{t.p}</p>
                </div>
              ))}
            </div>

            <h2 className="mt-10 text-[26px] font-extrabold">Mistakes that cost marks</h2>
            <ul className="mt-3 space-y-2">
              {page.mistakes.map((m) => (
                <li key={m} className="flex gap-2 text-[16px] text-gray-800"><span className="text-red-600" aria-hidden="true">✕</span>{m}</li>
              ))}
            </ul>

            <aside className="mt-10 rounded-2xl bg-[#0d2a6b] px-6 py-6 text-white">
              <p className="text-[12px] font-bold uppercase tracking-[0.25em]" style={{ color: Y }}>Practise it on the real screen</p>
              <h2 className="mt-1 text-[24px] font-extrabold">Full {page.name} papers, every week, with your T-Score at once</h2>
              <p className="mt-1 text-[15px] text-[#c9d3e6]">Up to 3 attempts per paper, the best T-Score per paper, and Full Mocks with all 5 tests. Message our team to join.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href={CONTACT.whatsapp} className="rounded-md px-5 py-2.5 text-[14px] font-bold text-[#0d2a6b]" style={{ background: Y }}>Join on WhatsApp →</a>
                <Link href="/packages" className="rounded-md border border-white/40 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-white/10">Packages & prices</Link>
              </div>
            </aside>

            <h2 className="mt-10 text-[26px] font-extrabold">Questions students ask</h2>
            <div className="mt-3 divide-y divide-gray-200 rounded-xl border border-gray-200">
              {page.faq.map((f) => (
                <details key={f.q} className="group px-5 py-4">
                  <summary className="cursor-pointer list-none text-[16px] font-semibold text-gray-900 marker:content-none">
                    <span className="mr-2 inline-block text-[#0d2a6b] transition group-open:rotate-90">▸</span>{f.q}
                  </summary>
                  <p className="mt-2 pl-6 text-[15px] leading-relaxed text-gray-700">{f.a}</p>
                </details>
              ))}
            </div>

            <h2 className="mt-12 text-[22px] font-extrabold">The other four tests</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {others.map((t) => (
                <li key={t.slug} className="rounded-xl border border-gray-200 p-4 hover:shadow-md">
                  <Link href={`/psycho-test/${t.slug}`} className="text-[15px] font-bold text-[#0d2a6b] hover:underline">Test {t.battery} · {t.name}</Link>
                  <p className="mt-1 text-[13px] text-gray-600">{t.questions} questions · {t.minutes} min</p>
                </li>
              ))}
            </ul>
          </article>

          <aside className="lg:sticky lg:top-20 lg:self-start">
            <p className="text-[12px] font-bold uppercase tracking-[0.25em] text-[#c8102e]">Prepare with Kautilya</p>
            <div className="mt-3 space-y-4">
              {side.map((p, i) => (
                <section key={p.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${i === 0 ? "border-[#0d2a6b] ring-2 ring-[#0d2a6b]/15" : "border-gray-200"}`}>
                  {i === 0 && <span className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0d2a6b]" style={{ background: Y }}>Recommended</span>}
                  <p className={`${i === 0 ? "mt-2" : ""} text-[11px] font-bold uppercase tracking-wider text-gray-500`}>{KIND_LABEL[p.kind]}</p>
                  <h3 className="mt-0.5 text-[18px] font-extrabold leading-tight">{p.name}</h3>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-[28px] font-extrabold text-[#0d2a6b]">{rupees(p.priceInr)}</span>
                    {p.mrpInr && p.mrpInr > p.priceInr && <span className="text-[13px] text-gray-400 line-through">{rupees(p.mrpInr)}</span>}
                  </div>
                  <p className="mt-1 text-[13px] text-gray-600">{p.kind === "combo" ? `Every ${page.name} paper, all the other tests, and every Full Mock.` : `Every ${page.name} paper and all the other practice papers.`}</p>
                  <Link href="/packages" className={`mt-3 block rounded-md px-4 py-2.5 text-center text-[14px] font-bold ${i === 0 ? "bg-[#0d2a6b] text-white hover:bg-[#0a2158]" : "border border-[#0d2a6b] text-[#0d2a6b] hover:bg-[#eef2fb]"}`}>See package</Link>
                </section>
              ))}
              <section className="rounded-2xl border-2 border-dashed border-green-400 bg-green-50 p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-green-700">New student?</p>
                <h3 className="mt-0.5 text-[18px] font-extrabold">Join on WhatsApp</h3>
                <p className="mt-1 text-[13px] text-gray-700">Send your name and mobile number; our team sets up your login and package the same day.</p>
                <a href={CONTACT.whatsapp} className="mt-3 block rounded-md bg-green-600 px-4 py-2.5 text-center text-[14px] font-bold text-white hover:bg-green-700">Message our team</a>
              </section>
            </div>
          </aside>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

function Stat({ big, label }: { big: string; label: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
      <div className="text-[24px] font-extrabold text-[#0d2a6b]">{big}</div>
      <div className="text-[12px] text-gray-600">{label}</div>
    </div>
  );
}
