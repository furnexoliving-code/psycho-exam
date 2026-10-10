import Link from "next/link";
import { formatDate, formatDateTime } from "@/lib/format-time";
import { Columns } from "@/components/admin/Charts";
import { RowForm } from "@/components/admin/RowForm";
import { PendingButton } from "@/components/admin/PendingButton";
import { refreshAnalytics } from "@/app/admin/(panel)/analytics/actions";
import type { Analytics, PaperDifficulty } from "@/lib/wt/analytics";

const SHOW_PAPERS = 12;

/**
 * The batch in figures. Reads top to bottom the way the owner asks the
 * questions: is the batch practising, how ready is it test by test, which
 * papers are hardest, who has gone quiet, how are the Full Mocks going.
 */
export function AnalyticsView({ a }: { a: Analytics }) {
  const pct = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0);
  const batteryTitle = new Map(a.batteries.map((b) => [b.battery, b.title]));
  const hardest = a.papers.slice(0, SHOW_PAPERS);
  const rest = a.papers.slice(SHOW_PAPERS);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-[13px] text-gray-600">
            How the batch is practising and where it stands, over every attempt on record. Pass mark T-Score {a.passT}; target {a.targetT}.
          </p>
        </div>
        <RowForm action={refreshAnalytics} className="flex items-center gap-2 text-[11.5px] text-gray-500">
          <span>Figures as of {formatDateTime(a.asOf)} · kept for 5 minutes</span>
          <PendingButton pendingLabel="Working…" className="rounded border border-gray-400 bg-white px-3 py-1 font-semibold text-gray-800 hover:bg-gray-100">
            Refresh now
          </PendingButton>
        </RowForm>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Practising · 14 days" value={a.totals.students14} note={`of ${a.totals.active.toLocaleString("en-IN")} switched-on students · ${pct(a.totals.students14, a.totals.active)}%`} bar="bg-[#2a78d6]" />
        <Kpi label="Attempts · 14 days" value={a.totals.attempts14} note={`${a.totals.attempts.toLocaleString("en-IN")} in all`} bar="bg-[#2a78d6]" />
        <Kpi label="Exam-ready" value={a.totals.ready} note={`at ${a.passT}+ in all 5 tests · ${pct(a.totals.ready, a.totals.satAny)}% of those who sat`} ink="text-green-700" bar="bg-green-600" />
        <Kpi label="Never sat a paper" value={a.totals.neverSat} note="switched-on, no attempt yet" ink={a.totals.neverSat ? "text-amber-700" : ""} bar="bg-amber-500" href="/admin/students" />
        <Kpi label="Quiet 7+ days" value={a.totals.quiet7} note="sat before, nothing this week" ink={a.totals.quiet7 ? "text-red-700" : ""} bar="bg-red-500" href="#quiet" />
        <Kpi label="Full Mocks finished" value={a.mocks.finished} note={`${a.mocks.students.toLocaleString("en-IN")} students · ${pct(a.mocks.qualified, a.mocks.finished)}% qualified`} bar="bg-[#0d2a6b]" href="/admin/mocks" />
      </div>

      <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-[14px] font-bold text-gray-900">Last 14 days</h2>
        <div className="mt-2 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Columns title="Attempts per day" note={`${a.totals.attempts14.toLocaleString("en-IN")} in all`} points={a.days.map((d) => ({ day: d.day, value: d.attempts }))} unit="attempts" />
          <Columns title="Students practising per day" note={`${a.totals.students14.toLocaleString("en-IN")} different students`} points={a.days.map((d) => ({ day: d.day, value: d.students }))} unit="students" />
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-[14px] font-bold text-gray-900">
          Readiness, test by test <span className="font-normal text-gray-500">· each student&apos;s best T-score in the test</span>
        </h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-rrb-banner text-left text-white">
                <th className="border border-gray-300 px-3 py-2">Test</th>
                <th className="border border-gray-300 px-3 py-2">Students sat</th>
                <th className="border border-gray-300 px-3 py-2">At {a.passT}+ (pass)</th>
                <th className="border border-gray-300 px-3 py-2">At {a.targetT}+ (target)</th>
                <th className="border border-gray-300 px-3 py-2">Mean best T</th>
                <th className="border border-gray-300 px-3 py-2">Hardest paper</th>
              </tr>
            </thead>
            <tbody>
              {a.batteries.map((b) => (
                <tr key={b.battery} className="bg-white even:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 font-semibold text-gray-900">
                    Test {b.battery} · {b.title}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 tabular-nums">{b.sat.toLocaleString("en-IN")}</td>
                  <td className="border border-gray-300 px-3 py-2">
                    <Share n={b.passed} of={b.sat} />
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <Share n={b.target} of={b.sat} />
                  </td>
                  <td className={`border border-gray-300 px-3 py-2 font-semibold tabular-nums ${b.meanBestT === null ? "text-gray-400" : b.meanBestT >= a.passT ? "text-green-700" : "text-red-700"}`}>{b.meanBestT === null ? "—" : b.meanBestT.toFixed(1)}</td>
                  <td className="border border-gray-300 px-3 py-2">
                    {b.hardest ? (
                      <>
                        <Link href={`/admin/papers/${b.hardest.slug}/analysis`} className="font-semibold text-rrb-banner hover:underline">
                          {b.hardest.name}
                        </Link>
                        <span className="text-gray-500"> · avg {b.hardest.meanPct.toFixed(0)}%</span>
                      </>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-[14px] font-bold text-gray-900">
          Paper difficulty <span className="font-normal text-gray-500">· hardest first, by the average score</span>
        </h2>
        <p className="mt-1 text-[12px] text-gray-500">A low average with a wide spread means the paper sorts students well; a low average with a narrow spread means something in it needs teaching, or a question needs a look.</p>
        {a.papers.length === 0 ? (
          <p className="mt-2 text-[12px] text-gray-500">No attempts yet.</p>
        ) : (
          <>
            <PaperTable rows={hardest} batteryTitle={batteryTitle} passT={a.passT} />
            {rest.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-[12px] font-semibold text-rrb-banner hover:underline">All {a.papers.length} papers</summary>
                <PaperTable rows={rest} batteryTitle={batteryTitle} passT={a.passT} />
              </details>
            )}
          </>
        )}
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section id="quiet" className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-[14px] font-bold text-gray-900">
            Gone quiet <span className="font-normal text-gray-500">· sat papers before, none in 7 days</span>
          </h2>
          <p className="mt-1 text-[12px] text-gray-500">
            The students most worth a call. Those who stopped most recently come first
            {a.totals.quiet7 > a.quiet.length ? `; the first ${a.quiet.length} of ${a.totals.quiet7} are listed` : ""}.
          </p>
          {a.quiet.length === 0 ? (
            <p className="mt-2 text-[12px] text-green-700">Nobody has gone quiet.</p>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-gray-100 text-left text-gray-700">
                    <th className="border border-gray-300 px-2 py-1.5">Student</th>
                    <th className="border border-gray-300 px-2 py-1.5">Last paper</th>
                    <th className="border border-gray-300 px-2 py-1.5">Attempts</th>
                    <th className="border border-gray-300 px-2 py-1.5">Best T</th>
                    <th className="border border-gray-300 px-2 py-1.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {a.quiet.map((s) => {
                    const digits = s.phone.replace(/\D/g, "");
                    return (
                      <tr key={s.id} className="bg-white even:bg-gray-50">
                        <td className="border border-gray-300 px-2 py-1.5">
                          <Link href={`/admin/students/${s.id}`} className="font-semibold text-rrb-banner hover:underline">
                            {s.name}
                          </Link>
                          <span className="block text-[11px] text-gray-500">{s.phone || "no mobile"}</span>
                        </td>
                        <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{formatDate(s.lastAt)}</td>
                        <td className="border border-gray-300 px-2 py-1.5 tabular-nums">{s.attempts}</td>
                        <td className={`border border-gray-300 px-2 py-1.5 font-semibold tabular-nums ${s.bestT === null ? "text-gray-400" : s.bestT >= a.passT ? "text-green-700" : "text-red-700"}`}>{s.bestT === null ? "—" : s.bestT.toFixed(1)}</td>
                        <td className="border border-gray-300 px-2 py-1.5 text-right">
                          {digits.length === 10 && (
                            <a
                              href={`https://wa.me/91${digits}?text=${encodeURIComponent(`Namaste ${s.name}, Kautilya Classes se. Aapne ${formatDate(s.lastAt)} se koi practice test nahi diya hai. Exam paas hai, aaj ek paper zaroor dein: https://kautilyaonline.com/practice`)}`}
                              target="_blank"
                              rel="noopener"
                              className="rounded bg-[#25D366] px-2 py-0.5 text-[11px] font-bold text-white hover:brightness-95"
                            >
                              WhatsApp
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-[14px] font-bold text-gray-900">Full Mocks</h2>
          {a.mocks.byMock.length === 0 ? (
            <p className="mt-2 text-[12px] text-gray-500">No Full Mock finished yet.</p>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-gray-100 text-left text-gray-700">
                    <th className="border border-gray-300 px-2 py-1.5">Mock</th>
                    <th className="border border-gray-300 px-2 py-1.5">Sat</th>
                    <th className="border border-gray-300 px-2 py-1.5">Qualified</th>
                    <th className="border border-gray-300 px-2 py-1.5">Mean / 30</th>
                  </tr>
                </thead>
                <tbody>
                  {a.mocks.byMock.map((m) => (
                    <tr key={m.slug || m.name} className="bg-white even:bg-gray-50">
                      <td className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-900 whitespace-nowrap">
                        {m.slug ? (
                          <Link href={`/admin/mocks/${m.slug}/results`} className="text-rrb-banner hover:underline">
                            {m.name}
                          </Link>
                        ) : (
                          m.name
                        )}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 tabular-nums">
                        {m.sat}
                        {m.students !== m.sat ? <span className="text-gray-500"> · {m.students} students</span> : null}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5">
                        <Share n={m.qualified} of={m.sat} />
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 tabular-nums">{m.meanOut30 === null ? "—" : m.meanOut30.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-[11px] text-gray-500">Each mock&apos;s own page has the leaderboard and every student&apos;s five T-scores.</p>
        </section>
      </div>
    </>
  );
}

function PaperTable({ rows, batteryTitle, passT }: { rows: PaperDifficulty[]; batteryTitle: Map<number, string>; passT: number }) {
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="bg-gray-100 text-left text-gray-700">
            <th className="border border-gray-300 px-2 py-1.5">Paper</th>
            <th className="border border-gray-300 px-2 py-1.5">Test</th>
            <th className="border border-gray-300 px-2 py-1.5">Students</th>
            <th className="border border-gray-300 px-2 py-1.5">Attempts</th>
            <th className="border border-gray-300 px-2 py-1.5">Average score</th>
            <th className="border border-gray-300 px-2 py-1.5">Spread</th>
            <th className="border border-gray-300 px-2 py-1.5">At {passT}+</th>
            <th className="border border-gray-300 px-2 py-1.5"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="bg-white even:bg-gray-50">
              <td className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-900">
                {p.name}
                {!p.published && <span className="ml-1 rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-700">DRAFT</span>}
              </td>
              <td className="border border-gray-300 px-2 py-1.5 text-gray-700">
                Test {p.battery} · {batteryTitle.get(p.battery) ?? ""}
              </td>
              <td className="border border-gray-300 px-2 py-1.5 tabular-nums">{p.students.toLocaleString("en-IN")}</td>
              <td className="border border-gray-300 px-2 py-1.5 tabular-nums">{p.attempts.toLocaleString("en-IN")}</td>
              <td className="border border-gray-300 px-2 py-1.5">{p.meanPct === null ? "—" : <Meter value={p.meanPct} />}</td>
              <td className="border border-gray-300 px-2 py-1.5 tabular-nums text-gray-700">{p.sdPct === null ? "—" : `± ${p.sdPct.toFixed(0)} pts`}</td>
              <td className="border border-gray-300 px-2 py-1.5 tabular-nums">{p.passRate === null ? <span className="text-gray-400">—</span> : `${p.passRate}%`}</td>
              <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap text-right">
                <Link href={`/admin/papers/${p.slug}/results`} className="font-semibold text-rrb-banner hover:underline">
                  Results
                </Link>
                <span className="text-gray-300"> · </span>
                <Link href={`/admin/papers/${p.slug}/analysis`} className="font-semibold text-rrb-banner hover:underline">
                  Questions
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** "118 · 43%" with a thin bar of the share, in the one series colour. */
function Share({ n, of }: { n: number; of: number }) {
  const p = of ? Math.round((n / of) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-[76px] whitespace-nowrap tabular-nums text-gray-900">
        {n.toLocaleString("en-IN")} <span className="text-gray-500">· {p}%</span>
      </span>
      <span className="h-1.5 w-[90px] overflow-hidden rounded-full bg-[#cde2fb]" aria-hidden="true">
        <span className="block h-full rounded-full bg-[#2a78d6]" style={{ width: `${p}%` }} />
      </span>
    </div>
  );
}

/** A percentage with its bar. */
function Meter({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-[38px] tabular-nums text-gray-900">{value.toFixed(0)}%</span>
      <span className="h-1.5 w-[70px] overflow-hidden rounded-full bg-[#cde2fb]" aria-hidden="true">
        <span className="block h-full rounded-full bg-[#2a78d6]" style={{ width: `${Math.min(100, value)}%` }} />
      </span>
    </div>
  );
}

function Kpi({ label, value, note, ink = "text-gray-900", bar, href }: { label: string; value: number; note: string; ink?: string; bar: string; href?: string }) {
  const body = (
    <>
      <div className={`h-1 ${bar}`} />
      <div className="px-4 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</div>
        <div className={`text-[24px] font-extrabold tabular-nums leading-tight ${ink || "text-gray-900"}`}>{value.toLocaleString("en-IN")}</div>
        <div className="text-[11px] text-gray-500">{note}</div>
      </div>
    </>
  );
  const cls = "overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm";
  return href ? (
    <Link href={href} className={`${cls} transition hover:-translate-y-0.5 hover:border-[#0d2a6b] hover:shadow-md`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
