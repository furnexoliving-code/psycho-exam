import Link from "next/link";
import { StudentHeader } from "@/components/StudentHeader";
import { BATTERIES } from "@/lib/wt/categories";
import type { BatteryProgress } from "@/lib/wt/progress";
import { hallPattern, sectionsOfBattery, type Section } from "@/lib/wt/sections";
import type { Series } from "@/lib/wt/series";

/**
 * Practice, arranged as the hall is: the five batteries, and in each
 * every kind of test the hall's index lists, in the hall's order, with
 * its question count and clock. A kind with papers opens on its own
 * page; a kind the portal has not published papers for yet still shows,
 * marked so, so a candidate sees the whole battery they will face.
 * A series the index does not know (a name the admin made up) follows
 * the index in its battery.
 */
export interface PracticeInput {
  profile: { full_name: string; photoUrl: string | null };
  groups: Map<number, Series[]>;
  hidden: readonly number[];
  progress: BatteryProgress[];
  /** Paper ids the student has sat at least once. */
  sat: Set<string>;
  stages: { pass: number; average: number; target: number };
}

const ICON: Record<number, string> = { 1: "🧠", 2: "🧭", 3: "🧊", 4: "👁️", 5: "🔍" };

/** One card: a section of the index (with or without papers), or a series outside it. */
interface Card {
  code: string | null;
  name: string;
  hindi: string | null;
  pattern: string | null;
  blurb: string | null;
  blurbHi: string | null;
  series: Series | null;
}

function cardsOf(battery: number, series: Series[]): Card[] {
  const ofSection = (s: Section, found: Series | undefined): Card => ({
    code: s.code,
    name: s.name,
    hindi: s.hindi,
    pattern: hallPattern(s),
    blurb: s.blurb,
    blurbHi: s.blurbHi,
    series: found ?? null,
  });
  const indexed = sectionsOfBattery(battery).map((s) => ofSection(s, series.find((x) => x.section === s)));
  const extra = series.filter((x) => !x.section).map((x): Card => ({ code: null, name: x.name, hindi: null, pattern: null, blurb: null, blurbHi: null, series: x }));
  return [...indexed, ...extra];
}

export function PracticeView({ profile, groups, hidden, progress, sat, stages }: PracticeInput) {
  const batteries = BATTERIES.filter((b) => !hidden.includes(b.id));
  const allPapers = [...groups.values()].flat().flatMap((s) => s.papers);
  const satCount = allPapers.filter((p) => sat.has(p.id)).length;

  return (
    <div className="flex min-h-screen flex-col bg-[#f3f5f9]">
      <StudentHeader name={profile.full_name || "Candidate"} photoUrl={profile.photoUrl} active="practice" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight text-gray-900">
              Practice Tests <span className="text-[15px] font-normal text-gray-500" lang="hi">/ अभ्यास परीक्षण</span>
            </h1>
            <p className="mt-1 text-[13px] text-gray-600">
              Sectional papers, battery by battery. Reach T-Score: {stages.pass} in every battery to unlock the Full Mocks; then {stages.average}, then {stages.target}.
            </p>
            <p className="mt-0.5 text-[12px] text-gray-500">
              Every test of the ALP battery is listed as the RDSO guideline (CBT, Jan 2020) gives it, with the hall's own question count and time.
              <span lang="hi"> हर टेस्ट हॉल के पैटर्न (प्रश्न और समय) के साथ।</span>
            </p>
          </div>
          <div className="rounded-[12px] border border-gray-200 bg-white px-4 py-2 text-center">
            <div className="text-[18px] font-extrabold tabular-nums text-gray-900">{satCount} <span className="text-[12px] font-semibold text-gray-500">/ {allPapers.length}</span></div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">papers attempted</div>
          </div>
        </div>

        {batteries.map((b) => {
          const series = groups.get(b.id) ?? [];
          const cards = cardsOf(b.id, series);
          const open = cards.filter((c) => c.series).length;
          const prog = progress.find((p) => p.battery === b.id);
          const t = prog?.bestT ?? null;
          const tone = t === null ? "text-gray-400" : t >= stages.target ? "text-green-700" : t >= stages.pass ? "text-amber-700" : "text-red-700";
          const papers = series.flatMap((s) => s.papers);
          return (
            <section key={b.id} id={`battery-${b.id}`} className="mt-5 scroll-mt-4 rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 pb-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#eef2fb] text-[20px]" aria-hidden="true">{ICON[b.id]}</span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[15px] font-bold text-gray-900">
                    Test {b.id} · {b.title} <span className="font-normal text-gray-500" lang="hi">/ {b.hindi}</span>
                  </h2>
                  <p className="text-[12px] text-gray-500">
                    {cards.length} test type{cards.length === 1 ? "" : "s"} · {open} with papers · {papers.length} paper{papers.length === 1 ? "" : "s"} · {papers.filter((p) => sat.has(p.id)).length} attempted
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-[20px] font-extrabold tabular-nums ${tone}`}>{t === null ? "—" : t.toFixed(0)}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">best T-Score</div>
                </div>
              </div>

              <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {cards.map((c) => (c.series ? <OpenCard key={c.code ?? c.series.slug} card={c} series={c.series} battery={b.id} sat={sat} /> : <SoonCard key={c.code ?? c.name} card={c} />))}
              </div>
            </section>
          );
        })}

        <p className="mt-5 text-[11px] text-gray-500">
          Tests marked <span className="rounded-full border border-gray-300 bg-gray-50 px-1.5 py-0.5 font-bold text-gray-600">Papers coming</span> are in the hall's battery; their practice papers open here as they are published.
          <span lang="hi"> ये टेस्ट हॉल की परीक्षा में हैं; इनके प्रैक्टिस पेपर जैसे-जैसे बनेंगे, यहीं खुलेंगे।</span>
        </p>
      </main>
    </div>
  );
}

function Code({ code, open }: { code: string | null; open: boolean }) {
  if (!code) return null;
  return (
    <span className={`inline-flex h-[22px] min-w-[26px] shrink-0 items-center justify-center rounded-md px-1.5 text-[11px] font-extrabold tabular-nums ${open ? "bg-[#0d2a6b] text-white" : "bg-gray-200 text-gray-600"}`}>
      {code}
    </span>
  );
}

function OpenCard({ card, series, battery, sat }: { card: Card; series: Series; battery: number; sat: Set<string> }) {
  const done = series.papers.filter((p) => sat.has(p.id)).length;
  const pct = series.papers.length ? Math.round((done / series.papers.length) * 100) : 0;
  return (
    <Link href={`/practice/${battery}/${series.slug}`} className="group flex flex-col rounded-[12px] border border-gray-200 bg-white p-3 transition hover:border-[#1d4ed8] hover:shadow-sm">
      <div className="flex items-start gap-2">
        <Code code={card.code} open />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[13px] font-bold leading-tight text-gray-900">{card.name}</span>
            <span className="text-gray-300 group-hover:text-[#1d4ed8]" aria-hidden="true">›</span>
          </div>
          {card.hindi && <div className="text-[11px] leading-tight text-gray-500" lang="hi">{card.hindi}</div>}
        </div>
      </div>
      {card.pattern && <div className="mt-2 text-[11px] font-semibold text-[#0d2a6b]">Hall pattern: {card.pattern}</div>}
      <div className="mt-auto pt-2 text-[11px] text-gray-500">
        {series.papers.length} paper{series.papers.length === 1 ? "" : "s"} · {done} attempted
      </div>
      <div className="mt-1.5 h-1.5 rounded bg-[#eef1f6]">
        <div className={`h-full rounded ${pct === 100 ? "bg-green-600" : "bg-[#1d4ed8]"}`} style={{ width: `${pct}%` }} />
      </div>
    </Link>
  );
}

function SoonCard({ card }: { card: Card }) {
  return (
    <div className="flex flex-col rounded-[12px] border border-dashed border-gray-300 bg-[#fafbfd] p-3" aria-label={`${card.name}: papers coming`}>
      <div className="flex items-start gap-2">
        <Code code={card.code} open={false} />
        <div className="min-w-0 flex-1">
          <span className="text-[13px] font-bold leading-tight text-gray-700">{card.name}</span>
          {card.hindi && <div className="text-[11px] leading-tight text-gray-500" lang="hi">{card.hindi}</div>}
        </div>
      </div>
      {card.pattern && <div className="mt-2 text-[11px] font-semibold text-gray-500">Hall pattern: {card.pattern}</div>}
      {card.blurb && <p className="mt-1 text-[11px] leading-snug text-gray-500">{card.blurb}</p>}
      <div className="mt-auto pt-2">
        <span className="rounded-full border border-gray-300 bg-gray-50 px-2 py-0.5 text-[10px] font-bold text-gray-600">Papers coming · जल्द</span>
      </div>
    </div>
  );
}
