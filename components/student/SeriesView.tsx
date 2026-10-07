import Link from "next/link";
import { formatDayMonth } from "@/lib/format-time";
import { StudentHeader } from "@/components/StudentHeader";
import { BATTERIES } from "@/lib/wt/categories";
import type { AttemptAllowance } from "@/lib/wt/attempts";
import type { Series } from "@/lib/wt/series";

/** One kind of test: its papers in order, with what the student has done on each. */
export interface PaperStat {
  sat: number;
  bestMarks: number | null;
  total: number | null;
  lastAt: string | null;
}

export interface SeriesInput {
  profile: { full_name: string; photoUrl: string | null };
  series: Series;
  allowances: Map<string, AttemptAllowance>;
  stats: Map<string, PaperStat>;
  /** The other series of the same battery, for moving sideways. */
  siblings: { name: string; slug: string }[];
}

export function SeriesView({ profile, series, allowances, stats, siblings }: SeriesInput) {
  const battery = BATTERIES.find((b) => b.id === series.battery);
  const sat = series.papers.filter((p) => (stats.get(p.id)?.sat ?? 0) > 0).length;

  return (
    <div className="flex min-h-screen flex-col bg-[#f3f5f9]">
      <StudentHeader name={profile.full_name || "Candidate"} photoUrl={profile.photoUrl} active="practice" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 sm:px-5">
        <nav className="text-[12px] text-gray-500" aria-label="Where you are">
          <Link href="/practice" className="font-semibold text-[#1d4ed8] hover:underline">Practice</Link>
          <span className="mx-1.5">›</span>
          <Link href={`/practice#battery-${series.battery}`} className="font-semibold text-[#1d4ed8] hover:underline">Test {series.battery} · {battery?.title}</Link>
          <span className="mx-1.5">›</span>
          <span className="text-gray-700">{series.name}</span>
        </nav>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight text-gray-900">{series.name}</h1>
            <p className="mt-0.5 text-[13px] text-gray-600">
              Test {series.battery} · {battery?.title} <span lang="hi">/ {battery?.hindi}</span> · {series.papers.length} paper{series.papers.length === 1 ? "" : "s"} · {sat} attempted
            </p>
          </div>
          {siblings.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {siblings.map((s) => (
                <Link key={s.slug} href={`/practice/${series.battery}/${s.slug}`} className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${s.slug === series.slug ? "border-[#1d4ed8] bg-[#1d4ed8] text-white" : "border-gray-300 bg-white text-gray-700 hover:border-[#1d4ed8]"}`}>
                  {s.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 overflow-hidden rounded-[14px] border border-gray-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#f8fafc] text-left text-[11px] uppercase tracking-wide text-gray-500">
                <th className="px-4 py-2.5 font-semibold">#</th>
                <th className="px-4 py-2.5 font-semibold">Paper</th>
                <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Questions · time</th>
                <th className="px-4 py-2.5 font-semibold">Your best</th>
                <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Attempts used</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {series.papers.map((p, i) => {
                const st = stats.get(p.id);
                const al = allowances.get(p.slug);
                const done = (st?.sat ?? 0) > 0;
                return (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 tabular-nums text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900">{p.displayName}</div>
                      {st?.lastAt && <div className="text-[11px] text-gray-500">last attempted {formatDayMonth(st.lastAt)}</div>}
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">{p.questionCount} Q · {p.timeLimitMin} min</td>
                    <td className="px-4 py-3">
                      {done && st?.bestMarks !== null && st?.bestMarks !== undefined ? (
                        <span className="font-bold tabular-nums text-gray-900">{st.bestMarks} / {st.total}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">
                      {al ? (al.max === null ? `${al.used} done` : `${al.used} of ${al.max}`) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {al?.exhausted ? (
                        <span className="flex flex-col items-end gap-1">
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">All attempts used</span>
                          <Link href={`/test/${p.slug}/result`} className="text-[11px] font-semibold text-[#1d4ed8] hover:underline">Result →</Link>
                        </span>
                      ) : (
                        <span className="flex flex-col items-end gap-1">
                          <Link href={`/test/${p.slug}`} className={`rounded-lg px-3 py-1.5 text-[12px] font-bold ${done ? "border border-[#1d4ed8] bg-white text-[#1d4ed8] hover:bg-[#eef2fb]" : "bg-[#1d4ed8] text-white hover:bg-[#1e40af]"}`}>
                            {done ? "Reattempt" : "Start"}
                          </Link>
                          {done && <Link href={`/test/${p.slug}/result`} className="text-[11px] font-semibold text-[#1d4ed8] hover:underline">Result →</Link>}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
