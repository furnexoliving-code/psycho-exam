import Link from "next/link";
import { StudentHeader } from "@/components/StudentHeader";
import { BATTERIES } from "@/lib/wt/categories";
import type { BatteryProgress } from "@/lib/wt/progress";
import type { Series } from "@/lib/wt/series";

/**
 * Practice, arranged as the hall is: the five batteries, and in each the
 * kinds of test (series) with their papers. Built for twenty series in a
 * battery and twenty papers in a series: this page shows the series as
 * cards with counts, and a series opens on its own page.
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
          </div>
          <div className="rounded-[12px] border border-gray-200 bg-white px-4 py-2 text-center">
            <div className="text-[18px] font-extrabold tabular-nums text-gray-900">{satCount} <span className="text-[12px] font-semibold text-gray-500">/ {allPapers.length}</span></div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">papers attempted</div>
          </div>
        </div>

        {batteries.map((b) => {
          const series = groups.get(b.id) ?? [];
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
                    {series.length} test type{series.length === 1 ? "" : "s"} · {papers.length} paper{papers.length === 1 ? "" : "s"} · {papers.filter((p) => sat.has(p.id)).length} attempted
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-[20px] font-extrabold tabular-nums ${tone}`}>{t === null ? "—" : t.toFixed(0)}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">best T-Score</div>
                </div>
              </div>

              {series.length === 0 ? (
                <p className="mt-3 text-[13px] text-gray-500">No paper published in this battery yet.</p>
              ) : (
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {series.map((s) => {
                    const done = s.papers.filter((p) => sat.has(p.id)).length;
                    const pct = s.papers.length ? Math.round((done / s.papers.length) * 100) : 0;
                    return (
                      <Link
                        key={s.slug}
                        href={`/practice/${b.id}/${s.slug}`}
                        className="group rounded-[12px] border border-gray-200 p-3 transition hover:border-[#1d4ed8] hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="min-w-0 truncate text-[13px] font-bold text-gray-900">{s.name}</span>
                          <span className="text-gray-300 group-hover:text-[#1d4ed8]" aria-hidden="true">›</span>
                        </div>
                        <div className="mt-1 text-[11px] text-gray-500">
                          {s.papers.length} paper{s.papers.length === 1 ? "" : "s"} · {done} attempted
                        </div>
                        <div className="mt-2 h-1.5 rounded bg-[#eef1f6]">
                          <div className={`h-full rounded ${pct === 100 ? "bg-green-600" : "bg-[#1d4ed8]"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </main>
    </div>
  );
}
