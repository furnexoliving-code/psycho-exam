import Link from "next/link";
import { CONTACT } from "@/lib/contact";
import { KIND_LABEL, rupees, type Package } from "@/lib/packages";
import { FreeMockCta } from "@/components/FreeMockCta";
import type { Faq, PlanRow, Step } from "@/lib/seo/content";

export const Y = "#ff9933";
export const NAVY = "#0d2a6b";

/** The pieces the public test pages are built from, so every page reads the same way. */
export function Crumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[12px] text-gray-500">
      {items.map((c, i) => (
        <span key={c.label}>
          {i > 0 && <span className="mx-1 text-gray-400">›</span>}
          {c.href ? <Link href={c.href} className="hover:underline">{c.label}</Link> : <span className="text-gray-700">{c.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-[#c8102e]">{children}</p>;
}

export function H2({ id, children, sub }: { id?: string; children: React.ReactNode; sub?: string }) {
  return (
    <h2 id={id} className="mt-12 scroll-mt-24 text-[26px] font-extrabold leading-tight text-gray-900">
      {children}
      {sub && <span className="ml-2 text-[16px] font-semibold text-gray-500" lang="hi">{sub}</span>}
    </h2>
  );
}

export function Stat({ big, label }: { big: string; label: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-center">
      <div className="text-[24px] font-extrabold text-[#0d2a6b]">{big}</div>
      <div className="text-[12px] text-gray-600">{label}</div>
    </div>
  );
}

/** Numbered steps with a heading each: how the screen runs, or the method. */
export function Steps({ steps, tone = "saffron" }: { steps: Step[]; tone?: "saffron" | "navy" }) {
  return (
    <ol className="mt-4 space-y-3">
      {steps.map((s, i) => (
        <li key={s.h} className="flex gap-3">
          <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${tone === "navy" ? "bg-[#0d2a6b] text-white" : "text-[#0d2a6b]"}`} style={tone === "saffron" ? { background: Y } : undefined}>{i + 1}</span>
          <div>
            <h3 className="text-[16.5px] font-bold text-gray-900">{s.h}</h3>
            <p className="mt-0.5 text-[15.5px] leading-relaxed text-gray-700">{s.p}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Tips({ tips }: { tips: Step[] }) {
  return (
    <div className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-200">
      {tips.map((t, i) => (
        <div key={t.h} className="px-5 py-4">
          <h3 className="text-[17px] font-bold text-gray-900"><span className="mr-2 text-[#c8102e]">{i + 1}.</span>{t.h}</h3>
          <p className="mt-1 text-[15px] leading-relaxed text-gray-700">{t.p}</p>
        </div>
      ))}
    </div>
  );
}

export function Mistakes({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-2">
      {items.map((m) => (
        <li key={m} className="flex gap-2 text-[16px] text-gray-800"><span className="text-red-600" aria-hidden="true">✕</span>{m}</li>
      ))}
    </ul>
  );
}

export function PlanTable({ rows, first = "Day" }: { rows: { day?: string; days?: string; task: string }[]; first?: string }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse text-[15px]">
        <thead>
          <tr className="bg-[#0d2a6b] text-left text-white"><th className="w-[120px] px-3 py-2">{first}</th><th className="px-3 py-2">What to do</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.day ?? r.days} className="border-b border-gray-200 even:bg-gray-50"><td className="px-3 py-2.5 font-bold text-[#0d2a6b]">{r.day ?? r.days}</td><td className="px-3 py-2.5 text-gray-800">{r.task}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="mt-4 divide-y divide-gray-200 rounded-xl border border-gray-200">
      {items.map((f) => (
        <details key={f.q} className="group px-5 py-4">
          <summary className="cursor-pointer list-none text-[16px] font-semibold text-gray-900 marker:content-none">
            <span className="mr-2 inline-block text-[#0d2a6b] transition group-open:rotate-90">▸</span>{f.q}
          </summary>
          <p className="mt-2 pl-6 text-[15px] leading-relaxed text-gray-700">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function HindiSummary({ text }: { text: string }) {
  return (
    <section className="mt-12 rounded-2xl border border-[#ff9933]/60 bg-[#fff7ee] p-5" lang="hi">
      <h2 className="text-[20px] font-extrabold text-gray-900">सारांश <span className="text-[14px] font-semibold text-gray-500">(हिंदी में)</span></h2>
      <p className="mt-2 text-[16px] leading-relaxed text-gray-800">{text}</p>
    </section>
  );
}

export function PlanRows({ rows }: { rows: PlanRow[] }) {
  return <PlanTable rows={rows} />;
}

/** The right column: the free mock, the packages with live prices, the way in, the laptop line. */
export function Sidebar({ packages, test, laptop = true }: { packages: Package[]; test?: string; laptop?: boolean }) {
  const combo = packages.find((p) => p.kind === "combo") ?? null;
  const sectional = packages.find((p) => p.kind === "sectional") ?? null;
  const side = [combo, sectional].filter((p): p is Package => Boolean(p));
  return (
    <aside className="lg:sticky lg:top-20 lg:self-start">
      <div className="space-y-4">
        <FreeMockCta variant="card" test={test} />
        {side.length > 0 && <Eyebrow>Prepare with Kautilya</Eyebrow>}
        {side.map((p, i) => (
          <section key={p.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${i === 0 ? "border-[#0d2a6b] ring-2 ring-[#0d2a6b]/15" : "border-gray-200"}`}>
            {i === 0 && <span className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0d2a6b]" style={{ background: Y }}>Recommended</span>}
            <p className={`${i === 0 ? "mt-2" : ""} text-[11px] font-bold uppercase tracking-wider text-gray-500`}>{KIND_LABEL[p.kind]}</p>
            <h3 className="mt-0.5 text-[18px] font-extrabold leading-tight">{p.name}</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[28px] font-extrabold text-[#0d2a6b]">{rupees(p.priceInr)}</span>
              {p.mrpInr && p.mrpInr > p.priceInr && <span className="text-[13px] text-gray-400 line-through">{rupees(p.mrpInr)}</span>}
            </div>
            <p className="mt-1 text-[13px] text-gray-600">{p.kind === "combo" ? `Every practice paper of all 19 kinds of test, and every Full Mock.` : `Every practice paper of all 19 kinds of test.`}</p>
            <Link href="/packages" className={`mt-3 block rounded-md px-4 py-2.5 text-center text-[14px] font-bold ${i === 0 ? "bg-[#0d2a6b] text-white hover:bg-[#0a2158]" : "border border-[#0d2a6b] text-[#0d2a6b] hover:bg-[#eef2fb]"}`}>See package</Link>
          </section>
        ))}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">New student?</p>
          <h3 className="mt-0.5 text-[18px] font-extrabold">Join on WhatsApp</h3>
          <p className="mt-1 text-[13px] text-gray-700">Send your name and mobile number; our team sets up your login the same day.</p>
          <a href={CONTACT.whatsapp} className="mt-3 block rounded-md bg-green-600 px-4 py-2.5 text-center text-[14px] font-bold text-white hover:bg-green-700">Message our team</a>
        </section>
        {laptop && (
          <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Laptop or desktop</p>
            <p className="mt-1 text-[13px] text-gray-700">The portal runs on a phone, but the hall is a desktop with a mouse. Sit every paper on a laptop or desktop for the real feel.</p>
            <p className="mt-1 text-[12px] text-gray-600" lang="hi">असली परीक्षा जैसा अनुभव लैपटॉप या डेस्कटॉप पर ही मिलता है।</p>
          </section>
        )}
      </div>
    </aside>
  );
}

/** A grid of linked cards: sibling kinds, the other tests, the guide. */
export function LinkCards({ items }: { items: { href: string; title: string; hindi?: string; note?: string }[] }) {
  return (
    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
      {items.map((c) => (
        <li key={c.href} className="rounded-xl border border-gray-200 p-4 transition hover:border-[#0d2a6b] hover:shadow-md">
          <Link href={c.href} className="text-[15px] font-bold text-[#0d2a6b] hover:underline">{c.title}</Link>
          {c.hindi && <p className="text-[12px] text-gray-500" lang="hi">{c.hindi}</p>}
          {c.note && <p className="mt-1 text-[13px] text-gray-600">{c.note}</p>}
        </li>
      ))}
    </ul>
  );
}

/** The dark band: the way in. */
export function JoinBand({ test }: { test: string }) {
  return (
    <aside className="mt-12 rounded-2xl bg-[#0d2a6b] px-6 py-6 text-white">
      <p className="text-[12px] font-bold uppercase tracking-[0.22em]" style={{ color: Y }}>Practise it on the real screen</p>
      <h2 className="mt-1 text-[24px] font-extrabold leading-tight">{test} papers with the hall&apos;s count and clock, and your T-Score at once</h2>
      <p className="mt-1 text-[15px] text-[#c9d3e6]">Up to 3 attempts per paper, the best T-Score per paper, review with the correct answers, and Full Mocks with all 5 tests. Sit them on a laptop or desktop, as in the hall.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/packages" className="rounded-md px-5 py-2.5 text-[14px] font-bold text-[#0d2a6b]" style={{ background: Y }}>Packages &amp; prices</Link>
        <a href={CONTACT.whatsapp} className="rounded-md border border-white/40 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-white/10">Join on WhatsApp →</a>
      </div>
    </aside>
  );
}
