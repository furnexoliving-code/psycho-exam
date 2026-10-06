import Link from "next/link";
import type { LeaderRow, MockResult } from "@/lib/wt/mock";

/**
 * The Full Mock scorecard, in the result page's own visual language: a row
 * of headline tiles, a table with one line per test, then the standing.
 * Status is never colour alone: each verdict carries a mark and a word.
 */
export function MockScorecard({
  mockName,
  mockSlug,
  candidate,
  rollNo,
  when,
  cutOffT,
  allowedMin,
  result,
  standing,
  leaders,
  batteries,
  myId,
}: {
  mockName: string;
  mockSlug: string;
  candidate: string;
  rollNo: string;
  when: string;
  cutOffT: number;
  allowedMin: number;
  result: MockResult;
  standing: { rank: number; outOf: number } | null;
  leaders: LeaderRow[];
  batteries: { id: number; title: string }[];
  myId: string;
}) {
  const marks = result.tests.reduce((s, t) => s + t.marks, 0);
  const total = result.tests.reduce((s, t) => s + t.total, 0);
  const verdict =
    result.qualified === true ? "QUALIFIED" : result.qualified === false ? "NOT QUALIFIED" : "PENDING";
  const verdictColor = result.qualified === true ? "text-green-700" : result.qualified === false ? "text-red-700" : "text-amber-700";

  return (
    <>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
            Full Mock scorecard <span className="font-semibold normal-case tracking-normal" lang="hi">/ स्कोरकार्ड</span>
          </div>
          <h1 className="text-[24px] font-bold text-gray-900">{mockName}</h1>
          <p className="text-[13px] text-gray-600">
            {candidate}{rollNo ? ` · Roll ${rollNo}` : ""} · {when}
          </p>
        </div>
        <Link href={`/mock/${mockSlug}`} className="text-[13px] font-semibold text-rrb-banner hover:underline">
          About this mock →
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Tile big={verdict} small={`every battery T ≥ ${cutOffT} · हर बैटरी में`} tone={verdictColor} />
        <Tile big={result.composite === null ? "—" : result.composite.toFixed(1)} small="Composite T-score" />
        <Tile big={standing ? `${standing.rank} / ${standing.outOf}` : "—"} small="Rank among candidates" />
        <Tile big={`${marks} / ${total}`} small="Total marks" />
        <Tile
          big={result.durationSec ? `${Math.round(result.durationSec / 60)} min` : "—"}
          small={`Time used of ${allowedMin}`}
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-700">
              <th className="px-4 py-2.5 font-semibold">Battery</th>
              <th className="px-4 py-2.5 font-semibold">Marks</th>
              <th className="px-4 py-2.5 font-semibold">T-score</th>
              <th className="px-4 py-2.5 font-semibold">Cut-off</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold">Review</th>
            </tr>
          </thead>
          <tbody>
            {result.tests.map((t) => {
              const title = batteries.find((b) => b.id === t.battery)?.title ?? t.name;
              const width = t.tScore === null ? 0 : Math.max(4, Math.min(100, ((t.tScore - 20) / 60) * 100));
              return (
                <tr key={t.paperId} className="border-t border-gray-100">
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-gray-900">Test {t.battery} · {title}</div>
                    <div className="text-[11px] text-gray-500">{t.name}</div>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">{t.marks} / {t.total}</td>
                  <td className="px-4 py-2.5">
                    <div className="font-bold tabular-nums text-gray-900">{t.tScore === null ? "—" : t.tScore.toFixed(1)}</div>
                    <div className="mt-1 h-1.5 w-28 overflow-hidden rounded bg-gray-200">
                      <div className="h-full rounded bg-[#1d4ed8]" style={{ width: `${width}%` }} />
                    </div>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">{cutOffT}</td>
                  <td className="px-4 py-2.5">
                    {t.cleared === true ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800">
                        ✓ {t.tScore !== null && t.tScore < cutOffT + 5 ? "Pass · weak" : "Pass"}
                      </span>
                    ) : t.cleared === false ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800">✕ Below {cutOffT}</span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800" title="Too few candidates on this paper yet to measure a T-score">
                        ? Not measured
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {t.slug && (
                      <Link href={`/watch-table/${t.slug}/result`} className="font-semibold text-rrb-banner hover:underline">
                        Solutions
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[12px] text-gray-500">
        T-score = 50 + 10 × (your marks − cohort mean) ÷ cohort SD, measured on each paper against everyone who has sat it.
        A test marked &ldquo;Not measured&rdquo; has too few candidates yet; it is re-measured on the paper&apos;s own result page as more sit it.
      </p>

      {leaders.length > 0 && (
        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-[15px] font-bold text-gray-900">Leaderboard · {mockName}</h2>
          <ol className="mt-2 divide-y divide-gray-100">
            {leaders.map((row) => (
              <li
                key={row.userId}
                className={`flex items-center gap-3 py-2 text-[13px] ${row.userId === myId ? "-mx-2 rounded-lg bg-blue-50 px-2 font-semibold" : ""}`}
              >
                <span className="w-7 text-gray-500">{row.rank}</span>
                <span className="flex-1 text-gray-900">{row.name}{row.userId === myId ? " (you)" : ""}</span>
                <span className="font-bold tabular-nums text-gray-900">{row.composite.toFixed(1)}</span>
              </li>
            ))}
            {standing && !leaders.some((l) => l.userId === myId) && (
              <li className="-mx-2 flex items-center gap-3 rounded-lg bg-blue-50 px-2 py-2 text-[13px] font-semibold">
                <span className="w-7 text-gray-500">{standing.rank}</span>
                <span className="flex-1 text-gray-900">{candidate} (you)</span>
                <span className="tabular-nums text-gray-900">{result.composite?.toFixed(1) ?? "—"}</span>
              </li>
            )}
          </ol>
        </section>
      )}
    </>
  );
}

function Tile({ big, small, tone = "text-gray-900" }: { big: string; small: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-center shadow-sm">
      <div className={`text-[20px] font-extrabold leading-tight ${tone}`}>{big}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-gray-500">{small}</div>
    </div>
  );
}
