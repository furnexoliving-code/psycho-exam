import Link from "next/link";
import { StudentHeader } from "@/components/StudentHeader";
import { BATTERIES } from "@/lib/wt/categories";
import type { BatteryProgress } from "@/lib/wt/progress";
import { LAST_EXAM_CODES, LAST_EXAM_LABEL, sectionsOfBattery, type Section } from "@/lib/wt/sections";
import type { Series } from "@/lib/wt/series";
import { formatDate, indianDay } from "@/lib/format-time";

/**
 * Practice, arranged as the hall is: the five batteries, and in each
 * every kind of test the hall's index lists, in the hall's order, with
 * its question count and clock. A kind with papers opens on its own
 * page; a kind the portal has not published papers for yet still shows,
 * marked so, so a candidate sees the whole battery they will face.
 * A series the index does not know (a name the admin made up) follows
 * the index in its battery.
 *
 * The five kinds the last exam gave are named at the top and framed in
 * gold below; the kind the student is weakest at is named and marked.
 */
export interface PracticeInput {
  profile: { full_name: string; photoUrl: string | null };
  groups: Map<number, Series[]>;
  hidden: readonly number[];
  progress: BatteryProgress[];
  /** Paper ids the student has sat at least once. */
  sat: Set<string>;
  /** The best T-score per paper sat, by paper id; a paper not yet measured is absent. */
  bestT: Map<string, number>;
  /** When each paper was last sat, by paper id; a paper never sat is absent. */
  lastAt: Map<string, string>;
  now: number;
  stages: { pass: number; average: number; target: number };
}

const ICON: Record<number, string> = { 1: "🧠", 2: "🧭", 3: "🧊", 4: "👁️", 5: "🔍" };

/** One colour per battery, so the five read apart at a glance. */
const TONE: Record<number, { bar: string; tint: string; soft: string; text: string; ring: string }> = {
  1: { bar: "from-[#6d28d9] to-[#a78bfa]", tint: "from-[#f3eefe]", soft: "bg-[#f3eefe]", text: "text-[#6d28d9]", ring: "hover:border-[#a78bfa]" },
  2: { bar: "from-[#1d4ed8] to-[#60a5fa]", tint: "from-[#e9effd]", soft: "bg-[#e9effd]", text: "text-[#1d4ed8]", ring: "hover:border-[#60a5fa]" },
  3: { bar: "from-[#0f766e] to-[#5eead4]", tint: "from-[#e6f6f4]", soft: "bg-[#e6f6f4]", text: "text-[#0f766e]", ring: "hover:border-[#5eead4]" },
  4: { bar: "from-[#b45309] to-[#fbbf24]", tint: "from-[#fdf3e3]", soft: "bg-[#fdf3e3]", text: "text-[#b45309]", ring: "hover:border-[#fbbf24]" },
  5: { bar: "from-[#be123c] to-[#fb7185]", tint: "from-[#fdebef]", soft: "bg-[#fdebef]", text: "text-[#be123c]", ring: "hover:border-[#fb7185]" },
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

/** "today", "yesterday", "3 days ago", else the date. */
function ago(iso: string, now: number): string {
  const then = indianDay(iso);
  const today = indianDay(now);
  if (then === today) return "today";
  const days = Math.round((Date.parse(`${today}T00:00:00+05:30`) - Date.parse(`${then}T00:00:00+05:30`)) / 86400000);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return formatDate(iso);
}

/** The best T among a kind's papers, when any is measured. */
function bestOf(series: Series, bestT: Map<string, number>): number | null {
  const ts = series.papers.map((p) => bestT.get(p.id)).filter((t): t is number => t !== undefined);
  return ts.length ? Math.max(...ts) : null;
}

/** When a kind was last practised: the newest of its papers' last sittings. */
function lastOf(series: Series, lastAt: Map<string, string>): string | null {
  let latest: string | null = null;
  for (const p of series.papers) {
    const at = lastAt.get(p.id);
    if (at && (!latest || at > latest)) latest = at;
  }
  return latest;
}

const isLastExam = (code: string | null) => code !== null && LAST_EXAM_CODES.includes(code);

export function PracticeView({ profile, groups, hidden, progress, sat, bestT, lastAt, now, stages }: PracticeInput) {
  const batteries = BATTERIES.filter((b) => !hidden.includes(b.id));
  const allPapers = [...groups.values()].flat().flatMap((s) => s.papers);
  const satCount = allPapers.filter((p) => sat.has(p.id)).length;
  const allCards = batteries.flatMap((b) => cardsOf(b.id, groups.get(b.id) ?? []).map((c) => ({ ...c, battery: b.id })));
  const openTypes = allCards.filter((c) => c.series).length;
  const measured = progress.filter((p) => batteries.some((b) => b.id === p.battery) && p.bestT !== null);
  const cleared = measured.filter((p) => (p.bestT ?? 0) >= stages.pass).length;
  // The kind the student is weakest at: the lowest best T among the kinds
  // measured. One card, so the next sitting has an obvious place to go.
  let weakest: { card: (typeof allCards)[number]; t: number } | null = null;
  for (const c of allCards) {
    if (!c.series) continue;
    const t = bestOf(c.series, bestT);
    if (t !== null && (weakest === null || t < weakest.t)) weakest = { card: c, t };
  }
  const lastExam = LAST_EXAM_CODES.map((code) => allCards.find((c) => c.code === code)).filter((c): c is (typeof allCards)[number] => c !== undefined);

  return (
    <div className="flex min-h-screen flex-col bg-[#f3f5f9]">
      <StudentHeader name={profile.full_name || "Candidate"} photoUrl={profile.photoUrl} active="practice" />

      <section className="relative overflow-hidden bg-gradient-to-br from-[#0b2461] via-[#10306f] to-[#1b1b5e] text-white">
        {/* Soft glows in the flag's colours, so the band is not a flat block. */}
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#ff9933]/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-[#138808]/30 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute right-1/3 top-0 h-56 w-56 rounded-full bg-[#60a5fa]/20 blur-3xl" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-5 sm:py-7">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#ffb84d]">Sectional practice · सेक्शनल अभ्यास</p>
              <h1 className="mt-1 text-[26px] font-extrabold tracking-tight sm:text-[30px]">
                Practice Tests <span className="text-[16px] font-normal text-blue-200" lang="hi">/ अभ्यास परीक्षण</span>
              </h1>
              <p className="mt-2 text-[13px] leading-relaxed text-blue-100">
                All {allCards.length} tests of the ALP battery, as the RDSO guideline (CBT, Jan 2020) lists them, with the hall&apos;s own question count and time.
                Reach T-Score {stages.pass} in every battery to unlock the Full Mocks; then {stages.average}, then {stages.target}.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <Stat value={satCount} of={allPapers.length} label="papers attempted" accent="text-[#ffb84d]" />
              <Stat value={openTypes} of={allCards.length} label="tests open" accent="text-white" />
              <Stat value={cleared} of={batteries.length} label={`batteries at ${stages.pass}+`} accent="text-[#86efac]" />
            </div>
          </div>

          {lastExam.length > 0 && (
            // The five the last exam gave, one per battery: the first thing
            // to practise, and framed in gold on their cards below.
            <div className="mt-5 rounded-[14px] border border-[#fbbf24]/50 bg-gradient-to-r from-[#fbbf24]/20 via-[#fbbf24]/10 to-transparent p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fbbf24] text-[18px] shadow-[0_0_0_4px_rgba(251,191,36,0.25)]" aria-hidden="true">⭐</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-extrabold leading-snug text-white" lang="hi">पिछली परीक्षा {LAST_EXAM_LABEL} में यही आए थे, इनका अभ्यास ज़रूर करें।</p>
                  <p className="text-[11.5px] text-blue-100">Asked in the last exam ({LAST_EXAM_LABEL}): practise these five first.</p>
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2 sm:pl-12">
                {lastExam.map((c) =>
                  c.series ? (
                    <Link key={c.code} href={`/practice/${c.battery}/${c.series.slug}`} className="rounded-full border border-[#fbbf24]/60 bg-[#fbbf24]/15 px-3 py-1 text-[12px] font-bold text-white transition hover:bg-[#fbbf24]/35">
                      <span className="text-[#ffd369]">{c.code}</span> {c.name}
                    </Link>
                  ) : (
                    <span key={c.code} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[12px] font-bold text-blue-100">
                      <span className="text-[#ffd369]">{c.code}</span> {c.name}
                    </span>
                  ),
                )}
              </div>
            </div>
          )}
          {weakest && weakest.card.series && (
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-blue-100">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#fb7185] shadow-[0_0_0_3px_rgba(251,113,133,0.3)]" aria-hidden="true" />
              <span className="font-bold text-white">Your weakest right now:</span>
              <Link href={`/practice/${weakest.card.battery}/${weakest.card.series.slug}`} className="font-extrabold text-[#ffd369] hover:underline">{weakest.card.name}</Link>
              <span>(best T {weakest.t.toFixed(0)}) · start there today.</span>
              <span lang="hi">अभी सबसे कमज़ोर यही है, आज यहीं से शुरू करें।</span>
            </p>
          )}
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
            <section key={b.id} id={`battery-${b.id}`} className="mt-5 scroll-mt-4 overflow-hidden rounded-[18px] border border-gray-200 bg-white shadow-sm">
              <div className={`h-1.5 bg-gradient-to-r ${tone.bar}`} />
              <div className={`bg-gradient-to-r ${tone.tint} to-white px-4 py-4 sm:px-5`}>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br ${tone.bar} text-[24px] shadow-md`} aria-hidden="true">{ICON[b.id]}</span>
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
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/80 ring-1 ring-black/5">
                        <div className={`h-full rounded-full bg-gradient-to-r ${pct === 100 ? "from-green-600 to-green-400" : tone.bar}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <TChip t={t} stages={stages} />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3 xl:grid-cols-4">
                {cards.map((c) =>
                  c.series ? (
                    <OpenCard
                      key={c.code ?? c.series.slug}
                      card={c}
                      series={c.series}
                      battery={b.id}
                      sat={sat}
                      bestT={bestT}
                      stages={stages}
                      marks={{ lastExam: isLastExam(c.code), weakest: weakest !== null && weakest.card.series === c.series, last: lastOf(c.series, lastAt), now }}
                    />
                  ) : (
                    <SoonCard key={c.code ?? c.name} card={c} lastExam={isLastExam(c.code)} />
                  ),
                )}
              </div>
            </section>
          );
        })}

        <p className="mt-5 text-[11px] text-gray-500">
          <span className="rounded-full border border-dashed border-gray-300 bg-white px-1.5 py-0.5 font-bold text-gray-500">Coming soon</span> tests are in the hall&apos;s battery; their practice papers open here as they are published.
          <span lang="hi"> ये टेस्ट हॉल की परीक्षा में हैं; इनके प्रैक्टिस पेपर जैसे-जैसे बनेंगे, यहीं खुलेंगे।</span>
          {" "}A gold frame marks a test the last exam gave.
          <span lang="hi"> सुनहरा फ्रेम = पिछली परीक्षा में आया।</span>
        </p>
      </main>
    </div>
  );
}

function Stat({ value, of, label, accent }: { value: number; of: number; label: string; accent: string }) {
  return (
    <div className="rounded-[12px] border border-white/15 bg-white/10 px-3 py-2 text-center backdrop-blur sm:px-4">
      <div className={`text-[20px] font-extrabold tabular-nums leading-tight sm:text-[22px] ${accent}`}>
        {value} <span className="text-[12px] font-semibold text-blue-200">/ {of}</span>
      </div>
      <div className="text-[9.5px] font-semibold uppercase tracking-wide text-blue-200 sm:text-[10px]">{label}</div>
    </div>
  );
}

function TChip({ t, stages }: { t: number | null; stages: { pass: number; target: number } }) {
  const style = t === null ? "border-gray-200 bg-white text-gray-400" : t >= stages.target ? "border-green-200 bg-green-50 text-green-700" : t >= stages.pass ? "border-amber-200 bg-amber-50 text-amber-700" : "border-red-200 bg-red-50 text-red-700";
  const word = t === null ? "not yet" : t >= stages.target ? "target" : t >= stages.pass ? "passed" : "below pass";
  return (
    <div className={`min-w-[88px] rounded-[12px] border px-3 py-1.5 text-center shadow-sm ${style}`}>
      <div className="text-[20px] font-extrabold tabular-nums leading-tight">{t === null ? "—" : t.toFixed(0)}</div>
      <div className="text-[9.5px] font-semibold uppercase tracking-wide">best T · {word}</div>
    </div>
  );
}

/** The test type's own best T-score, on its card: the best of its papers. */
function BestT({ t, done, stages }: { t: number | null; done: boolean; stages: { pass: number; target: number } }) {
  if (t === null) {
    return (
      <span className="shrink-0 rounded-[10px] border border-gray-200 bg-gray-50 px-2 py-1 text-center leading-tight text-gray-400" title={done ? "Too few students on these papers yet to measure a T-score" : "Not attempted yet"}>
        <span className="block text-[14px] font-extrabold">—</span>
        <span className="block text-[8.5px] font-semibold uppercase tracking-wide">best T</span>
      </span>
    );
  }
  const style = t >= stages.target ? "border-green-200 bg-green-50 text-green-700" : t >= stages.pass ? "border-amber-200 bg-amber-50 text-amber-700" : "border-red-200 bg-red-50 text-red-700";
  return (
    <span className={`shrink-0 rounded-[10px] border px-2 py-1 text-center leading-tight ${style}`}>
      <span className="block text-[14px] font-extrabold tabular-nums">{t.toFixed(0)}</span>
      <span className="block text-[8.5px] font-semibold uppercase tracking-wide">best T</span>
    </span>
  );
}

function Chip({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${muted ? "bg-gray-100 text-gray-500" : "bg-[#eef2fb] text-[#0d2a6b]"}`}>{children}</span>;
}

/** The code in its battery's colour; a gold star on it for a test the last exam gave. */
function CodeBadge({ code, battery, star, muted = false }: { code: string; battery: number; star: boolean; muted?: boolean }) {
  const tone = TONE[battery] ?? TONE[2];
  return (
    <span className="relative shrink-0">
      <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-extrabold ${muted ? "bg-gray-200 text-gray-600" : `bg-gradient-to-br ${tone.bar} text-white shadow`}`}>{code}</span>
      {star && <span className="absolute -right-1.5 -top-1.5 text-[12px] drop-shadow" aria-label="Asked in the last exam" title={`Asked in the last exam (${LAST_EXAM_LABEL})`}>⭐</span>}
    </span>
  );
}

/** What a card is marked with besides its figures. */
interface Marks {
  /** One of the last exam's five. */
  lastExam: boolean;
  /** The kind the student is weakest at. */
  weakest: boolean;
  /** When the kind was last practised. */
  last: string | null;
  now: number;
}

function OpenCard({ card, series, battery, sat, bestT, stages, marks }: { card: Card; series: Series; battery: number; sat: Set<string>; bestT: Map<string, number>; stages: { pass: number; target: number }; marks: Marks }) {
  const tone = TONE[battery] ?? TONE[2];
  const done = series.papers.filter((p) => sat.has(p.id)).length;
  const pct = series.papers.length ? Math.round((done / series.papers.length) * 100) : 0;
  const t = bestOf(series, bestT);
  const frame = marks.lastExam
    ? "border-[#f59e0b] bg-gradient-to-b from-[#fffbeb] to-white shadow-[0_0_0_3px_rgba(251,191,36,0.22)]"
    : `border-gray-200 bg-white ${tone.ring}`;
  return (
    <Link href={`/practice/${battery}/${series.slug}`} className={`group flex flex-col overflow-hidden rounded-[14px] border shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${frame}`}>
      <div className={`h-1 bg-gradient-to-r ${marks.lastExam ? "from-[#f59e0b] to-[#fde68a]" : tone.bar}`} />
      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-start gap-2.5">
          {card.code && <CodeBadge code={card.code} battery={battery} star={marks.lastExam} />}
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-extrabold leading-tight text-gray-900">{card.name}</div>
            {card.hindi && <div className="text-[11px] leading-tight text-gray-500" lang="hi">{card.hindi}</div>}
          </div>
          <BestT t={t} done={done > 0} stages={stages} />
        </div>
        {marks.weakest && (
          <div className="mt-2.5">
            <span className="rounded-full border border-red-200 bg-gradient-to-r from-red-50 to-rose-100 px-2 py-0.5 text-[10px] font-bold text-red-700" title="Your lowest best T-score">▼ Weakest · सबसे कमज़ोर</span>
          </div>
        )}
        {card.questions && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Chip>{card.questions}</Chip>
            <Chip>{card.time}</Chip>
          </div>
        )}
        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="text-gray-600">{series.papers.length} paper{series.papers.length === 1 ? "" : "s"} · {done} attempted</span>
            <span className={`shrink-0 font-bold ${tone.text}`}>{done === 0 ? "Start" : pct === 100 ? "Reattempt" : "Continue"} ›</span>
          </div>
          <div className="mt-0.5 text-[10.5px] text-gray-500">
            {marks.last ? `Last practised ${ago(marks.last, marks.now)}` : "Not started yet"}
            <span className="ml-1" lang="hi">{marks.last ? "· पिछली बार" : "· अभी शुरू नहीं"}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#eef1f6]">
            <div className={`h-full rounded-full bg-gradient-to-r ${pct === 100 ? "from-green-600 to-green-400" : tone.bar}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function SoonCard({ card, lastExam = false }: { card: Card; lastExam?: boolean }) {
  return (
    <div className={`flex flex-col rounded-[14px] border border-dashed p-3.5 ${lastExam ? "border-[#f59e0b] bg-gradient-to-b from-[#fffbeb] to-[#fafbfd]" : "border-gray-300 bg-[#fafbfd]"}`} aria-label={`${card.name}: coming soon`}>
      <div className="flex items-start gap-2.5">
        {card.code && <CodeBadge code={card.code} battery={0} star={lastExam} muted />}
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
