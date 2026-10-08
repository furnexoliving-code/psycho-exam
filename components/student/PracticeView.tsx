import Link from "next/link";
import { StudentHeader } from "@/components/StudentHeader";
import { BATTERIES } from "@/lib/wt/categories";
import type { BatteryProgress } from "@/lib/wt/progress";
import { sectionsOfBattery, type Section } from "@/lib/wt/sections";
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

/** One colour per battery, so the five read apart at a glance. */
const TONE: Record<number, { bar: string; badge: string; soft: string; text: string; ring: string; fill: string }> = {
  1: { bar: "from-[#6d28d9] to-[#a78bfa]", badge: "bg-[#6d28d9]", soft: "bg-[#f3eefe]", text: "text-[#6d28d9]", ring: "hover:border-[#6d28d9]", fill: "bg-[#6d28d9]" },
  2: { bar: "from-[#1d4ed8] to-[#60a5fa]", badge: "bg-[#1d4ed8]", soft: "bg-[#e9effd]", text: "text-[#1d4ed8]", ring: "hover:border-[#1d4ed8]", fill: "bg-[#1d4ed8]" },
  3: { bar: "from-[#0f766e] to-[#5eead4]", badge: "bg-[#0f766e]", soft: "bg-[#e6f6f4]", text: "text-[#0f766e]", ring: "hover:border-[#0f766e]", fill: "bg-[#0f766e]" },
  4: { bar: "from-[#b45309] to-[#fbbf24]", badge: "bg-[#b45309]", soft: "bg-[#fdf3e3]", text: "text-[#b45309]", ring: "hover:border-[#b45309]", fill: "bg-[#b45309]" },
  5: { bar: "from-[#be123c] to-[#fb7185]", badge: "bg-[#be123c]", soft: "bg-[#fdebef]", text: "text-[#be123c]", ring: "hover:border-[#be123c]", fill: "bg-[#be123c]" },
};

/** One card: a section of the index (with or without papers), or a series outside it. */
interface Card {
  code: string | null;
  name: string;
  hindi: string | null;
  questions: string | null;
  time: string | null;
  series: Series | null;
}

function cardsOf(battery: number, series: Series[]): Card[] {
  const ofSection = (s: Section, found: Series | undefined): Card => ({
    code: s.code,
    name: s.name,
    hindi: s.hindi,
    questions: s.questionsNote ? `${s.questions} Q (${s.questionsNote})` : `${s.questions} Q`,
    time: s.timeNote ? `${s.timeMin} min (${s.timeNote})` : `${s.timeMin} min`,
    series: found ?? null,
  });
  const indexed = sectionsOfBattery(battery).map((s) => ofSection(s, series.find((x) => x.section === s)));
  const extra = series.filter((x) => !x.section).map((x): Card => ({ code: null, name: x.name, hindi: null, questions: null, time: null, series: x }));
  return [...indexed, ...extra];
}

export function PracticeView({ profile, groups, hidden, progress, sat, stages }: PracticeInput) {
  const batteries = BATTERIES.filter((b) => !hidden.includes(b.id));
  const allPapers = [...groups.values()].flat().flatMap((s) => s.papers);
  const satCount = allPapers.filter((p) => sat.has(p.id)).length;
  const allCards = batteries.flatMap((b) => cardsOf(b.id, groups.get(b.id) ?? []));
  const openTypes = allCards.filter((c) => c.series).length;
  const measured = progress.filter((p) => batteries.some((b) => b.id === p.battery) && p.bestT !== null);
  const cleared = measured.filter((p) => (p.bestT ?? 0) >= stages.pass).length;

  return (
    <div className="flex min-h-screen flex-col bg-[#f3f5f9]">
      <StudentHeader name={profile.full_name || "Candidate"} photoUrl={profile.photoUrl} active="practice" />

      <section className="bg-[#0d2a6b] text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-5 sm:py-7">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#ff9933]">Sectional practice · सेक्शनल अभ्यास</p>
              <h1 className="mt-1 text-[26px] font-extrabold tracking-tight sm:text-[30px]">
                Practice Tests <span className="text-[16px] font-normal text-blue-200" lang="hi">/ अभ्यास परीक्षण</span>
              </h1>
              <p className="mt-2 text-[13px] leading-relaxed text-blue-100">
                All {allCards.length} tests of the ALP battery, as the RDSO guideline (CBT, Jan 2020) lists them, with the hall&apos;s own question count and time.
                Reach T-Score {stages.pass} in every battery to unlock the Full Mocks; then {stages.average}, then {stages.target}.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <Stat value={satCount} of={allPapers.length} label="papers attempted" />
              <Stat value={openTypes} of={allCards.length} label="tests open" />
              <Stat value={cleared} of={batteries.length} label={`batteries at ${stages.pass}+`} />
            </div>
          </div>
        </div>
        <div className="h-1 bg-gradient-to-r from-[#ff9933] via-white to-[#138808]" />
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-5">
        {batteries.map((b) => {
          const tone = TONE[b.id] ?? TONE[2];
          const series = groups.get(b.id) ?? [];
          const cards = cardsOf(b.id, series);
          const open = cards.filter((c) => c.series).length;
          const prog = progress.find((p) => p.battery === b.id);
          const t = prog?.bestT ?? null;
          const papers = series.flatMap((s) => s.papers);
          const done = papers.filter((p) => sat.has(p.id)).length;
          const pct = papers.length ? Math.round((done / papers.length) * 100) : 0;
          return (
            <section key={b.id} id={`battery-${b.id}`} className="mt-5 scroll-mt-4 overflow-hidden rounded-[16px] border border-gray-200 bg-white shadow-sm">
              <div className={`h-1.5 bg-gradient-to-r ${tone.bar}`} />
              <div className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-[24px] ${tone.soft}`} aria-hidden="true">{ICON[b.id]}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[11px] font-bold uppercase tracking-[0.15em] ${tone.text}`}>Test {b.id} of 5</p>
                    <h2 className="text-[17px] font-extrabold leading-tight text-gray-900">
                      {b.title} <span className="text-[14px] font-normal text-gray-500" lang="hi">/ {b.hindi}</span>
                    </h2>
                    <p className="mt-0.5 text-[12px] text-gray-500">
                      {cards.length} test types · {open} open · {papers.length} paper{papers.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-5">
                    <div className="hidden w-36 sm:block">
                      <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        <span>Attempted</span><span className="tabular-nums">{done}/{papers.length}</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-[#eef1f6]">
                        <div className={`h-full rounded-full ${pct === 100 ? "bg-green-600" : tone.fill}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <TChip t={t} stages={stages} />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {cards.map((c) => (c.series ? <OpenCard key={c.code ?? c.series.slug} card={c} series={c.series} battery={b.id} sat={sat} /> : <SoonCard key={c.code ?? c.name} card={c} />))}
                </div>
              </div>
            </section>
          );
        })}

        <p className="mt-5 text-[11px] text-gray-500">
          <span className="rounded-full border border-dashed border-gray-300 bg-white px-1.5 py-0.5 font-bold text-gray-500">Coming soon</span> tests are in the hall&apos;s battery; their practice papers open here as they are published.
          <span lang="hi"> ये टेस्ट हॉल की परीक्षा में हैं; इनके प्रैक्टिस पेपर जैसे-जैसे बनेंगे, यहीं खुलेंगे।</span>
        </p>
      </main>
    </div>
  );
}

function Stat({ value, of, label }: { value: number; of: number; label: string }) {
  return (
    <div className="rounded-[12px] border border-white/15 bg-white/10 px-3 py-2 text-center backdrop-blur sm:px-4">
      <div className="text-[20px] font-extrabold tabular-nums leading-tight sm:text-[22px]">
        {value} <span className="text-[12px] font-semibold text-blue-200">/ {of}</span>
      </div>
      <div className="text-[9.5px] font-semibold uppercase tracking-wide text-blue-200 sm:text-[10px]">{label}</div>
    </div>
  );
}

function TChip({ t, stages }: { t: number | null; stages: { pass: number; target: number } }) {
  const style = t === null ? "border-gray-200 bg-gray-50 text-gray-400" : t >= stages.target ? "border-green-200 bg-green-50 text-green-700" : t >= stages.pass ? "border-amber-200 bg-amber-50 text-amber-700" : "border-red-200 bg-red-50 text-red-700";
  const word = t === null ? "not yet" : t >= stages.target ? "target" : t >= stages.pass ? "passed" : "below pass";
  return (
    <div className={`min-w-[88px] rounded-[12px] border px-3 py-1.5 text-center ${style}`}>
      <div className="text-[20px] font-extrabold tabular-nums leading-tight">{t === null ? "—" : t.toFixed(0)}</div>
      <div className="text-[9.5px] font-semibold uppercase tracking-wide">best T · {word}</div>
    </div>
  );
}

function Chip({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${muted ? "bg-gray-100 text-gray-500" : "bg-[#eef2fb] text-[#0d2a6b]"}`}>{children}</span>;
}

function OpenCard({ card, series, battery, sat }: { card: Card; series: Series; battery: number; sat: Set<string> }) {
  const tone = TONE[battery] ?? TONE[2];
  const done = series.papers.filter((p) => sat.has(p.id)).length;
  const pct = series.papers.length ? Math.round((done / series.papers.length) * 100) : 0;
  return (
    <Link href={`/practice/${battery}/${series.slug}`} className={`group flex flex-col rounded-[14px] border border-gray-200 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${tone.ring}`}>
      <div className="flex items-start gap-2.5">
        {card.code && <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold text-white ${tone.badge}`}>{card.code}</span>}
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-extrabold leading-tight text-gray-900">{card.name}</div>
          {card.hindi && <div className="text-[11px] leading-tight text-gray-500" lang="hi">{card.hindi}</div>}
        </div>
      </div>
      {card.questions && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Chip>{card.questions}</Chip>
          <Chip>{card.time}</Chip>
        </div>
      )}
      <div className="mt-auto pt-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-gray-600">{series.papers.length} paper{series.papers.length === 1 ? "" : "s"} · {done} attempted</span>
          <span className={`font-bold ${tone.text}`}>{done === 0 ? "Start" : pct === 100 ? "Reattempt" : "Continue"} ›</span>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-[#eef1f6]">
          <div className={`h-full rounded-full ${pct === 100 ? "bg-green-600" : tone.fill}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </Link>
  );
}

function SoonCard({ card }: { card: Card }) {
  return (
    <div className="flex flex-col rounded-[14px] border border-dashed border-gray-300 bg-[#fafbfd] p-3.5" aria-label={`${card.name}: coming soon`}>
      <div className="flex items-start gap-2.5">
        {card.code && <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[12px] font-extrabold text-gray-600">{card.code}</span>}
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-extrabold leading-tight text-gray-700">{card.name}</div>
          {card.hindi && <div className="text-[11px] leading-tight text-gray-500" lang="hi">{card.hindi}</div>}
        </div>
      </div>
      {card.questions && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Chip muted>{card.questions}</Chip>
          <Chip muted>{card.time}</Chip>
        </div>
      )}
      <div className="mt-auto pt-3">
        <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 bg-white px-2 py-0.5 text-[10px] font-bold text-gray-500">
          <span aria-hidden="true">⏳</span> Coming soon · जल्द
        </span>
      </div>
    </div>
  );
}
