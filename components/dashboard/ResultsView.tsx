import Link from "next/link";
import { formatDateTime } from "@/lib/format-time";
import { StudentHeader } from "@/components/StudentHeader";
import { BATTERIES, CATEGORIES } from "@/lib/wt/categories";
import type { PastAttemptRow } from "@/lib/wt/history";
import { scoreOutOf30, type MockResult } from "@/lib/wt/mock";

/**
 * Every result in one place: the Full Mocks on top (the ones that count
 * the way the real exam does), then every sectional paper, with a battery
 * filter. Each row opens its own result page.
 */
export interface ResultsInput {
  profile: { full_name: string; photoUrl: string | null };
  mockResults: (MockResult & { mockName: string; mockSlug: string })[];
  attempts: PastAttemptRow[];
  /** The battery filter in force; 0 for all. */
  battery: number;
  passT: number;
}

export function ResultsView({ profile, mockResults, attempts, battery, passT }: ResultsInput) {
  const batteryOf = (category: string) => CATEGORIES.find((c) => c.id === category)?.battery ?? 2;
  const shown = battery ? attempts.filter((a) => batteryOf(a.category) === battery) : attempts;
  const counts = new Map<number, number>();
  for (const a of attempts) counts.set(batteryOf(a.category), (counts.get(batteryOf(a.category)) ?? 0) + 1);

  return (
    <div className="flex min-h-screen flex-col bg-[#f3f5f9]">
      <StudentHeader name={profile.full_name || "Candidate"} photoUrl={profile.photoUrl} active="results" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-5">
        <h1 className="text-[22px] font-extrabold tracking-tight text-gray-900">
          My results <span className="text-[15px] font-normal text-gray-500" lang="hi">/ मेरे परिणाम</span>
        </h1>
        <p className="mt-1 text-[13px] text-gray-600">
          Full Mocks first, as the real exam counts them; then every practice paper you have attempted. Open any row to see the full result and the review.
        </p>

        {/* ------------------------------ Full Mocks ------------------------------ */}
        <section className="mt-4 rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm sm:p-5" id="mocks">
          <h2 className="text-[14px] font-bold text-gray-900">
            Full Mock results <span className="font-normal text-gray-500" lang="hi">/ पूर्ण मॉक परिणाम</span>
            <span className="ml-2 rounded-full bg-[#eef2fb] px-2 py-0.5 text-[11px] font-bold text-[#0d2a6b]">{mockResults.length}</span>
          </h2>
          {mockResults.length === 0 ? (
            <p className="mt-2 text-[13px] text-gray-500">
              No Full Mock finished yet. A mock opens once every battery is at T-Score: {passT} or above in sectional practice.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500">
                    <th className="py-2 pr-3 font-semibold">Full Mock</th>
                    <th className="py-2 pr-3 font-semibold">Date</th>
                    <th className="py-2 pr-3 font-semibold">Score / 30</th>
                    <th className="py-2 pr-3 font-semibold">T-scores · Test 1 → 5</th>
                    <th className="py-2 pr-3 font-semibold">Result</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {mockResults.map((r) => {
                    const out30 = scoreOutOf30(r.tests);
                    const ts = [1, 2, 3, 4, 5].map((b) => r.tests.find((t) => t.battery === b)?.tScore ?? null);
                    return (
                      <tr key={r.id} className="border-t border-gray-100">
                        <td className="py-2.5 pr-3 font-semibold text-gray-900">{r.mockName}</td>
                        <td className="py-2.5 pr-3 text-gray-600">{formatDateTime(r.submittedAt)}</td>
                        <td className="py-2.5 pr-3">
                          <span className="text-[16px] font-extrabold tabular-nums text-gray-900">{out30 === null ? "—" : out30.toFixed(1)}</span>
                          <span className="text-[10px] font-semibold text-gray-500"> / 30</span>
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className="flex flex-wrap gap-1">
                            {ts.map((t, i) => (
                              <span
                                key={i}
                                className={`rounded px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${
                                  t === null ? "bg-gray-100 text-gray-500" : t >= passT ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                                }`}
                                title={`Test ${i + 1}`}
                              >
                                {t === null ? "—" : t.toFixed(0)}
                              </span>
                            ))}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${r.qualified === true ? "bg-green-50 text-green-700" : r.qualified === false ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                            {r.qualified === true ? "✓ Qualified" : r.qualified === false ? "✕ Not qualified" : "? Pending"}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <Link href={`/mock/${r.mockSlug}/result`} className="font-semibold text-[#1d4ed8] hover:underline">Scorecard →</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ------------------------------ Sectional ------------------------------ */}
        <section className="mt-4 rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm sm:p-5" id="sectional">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[14px] font-bold text-gray-900">
              Sectional results <span className="font-normal text-gray-500" lang="hi">/ सेक्शनल परिणाम</span>
              <span className="ml-2 rounded-full bg-[#eef2fb] px-2 py-0.5 text-[11px] font-bold text-[#0d2a6b]">{attempts.length}</span>
            </h2>
            <nav className="ml-auto flex flex-wrap gap-1.5" aria-label="Filter by test">
              <FilterChip href="/results" active={battery === 0} label="All" count={attempts.length} />
              {BATTERIES.map((b) => (
                <FilterChip key={b.id} href={`/results?battery=${b.id}`} active={battery === b.id} label={`Test ${b.id}`} count={counts.get(b.id) ?? 0} title={b.title} />
              ))}
            </nav>
          </div>
          {shown.length === 0 ? (
            <p className="mt-3 text-[13px] text-gray-500">
              {attempts.length === 0 ? "No paper attempted yet. Start from the dashboard's Today's plan." : "No paper of this test attempted yet."}
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500">
                    <th className="py-2 pr-3 font-semibold">Test</th>
                    <th className="py-2 pr-3 font-semibold">Paper</th>
                    <th className="py-2 pr-3 font-semibold">Date</th>
                    <th className="py-2 pr-3 font-semibold">Marks</th>
                    <th className="py-2 pr-3 font-semibold">Attempted</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((a) => {
                    const b = batteryOf(a.category);
                    const pct = a.total ? Math.round((a.marks / a.total) * 100) : 0;
                    return (
                      <tr key={a.id} className="border-t border-gray-100">
                        <td className="py-2.5 pr-3">
                          <span className="rounded bg-[#eef2fb] px-1.5 py-0.5 text-[11px] font-bold text-[#0d2a6b]">Test {b}</span>
                          <span className="ml-1.5 text-[12px] text-gray-500">{BATTERIES.find((x) => x.id === b)?.title.replace(" Test", "")}</span>
                        </td>
                        <td className="py-2.5 pr-3 font-semibold text-gray-900">{a.paperName}</td>
                        <td className="py-2.5 pr-3 text-gray-600">{formatDateTime(a.submittedAt)}</td>
                        <td className="py-2.5 pr-3">
                          <span className="font-bold tabular-nums text-gray-900">{a.marks} / {a.total}</span>
                          <span className="ml-1.5 text-[11px] text-gray-500">{pct}%</span>
                        </td>
                        <td className="py-2.5 pr-3 tabular-nums text-gray-600">{a.attempted} / {a.total}</td>
                        <td className="py-2.5 text-right">
                          <Link href={`/test/${a.paperSlug}/result`} className="font-semibold text-[#1d4ed8] hover:underline">View →</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function FilterChip({ href, active, label, count, title }: { href: string; active: boolean; label: string; count: number; title?: string }) {
  return (
    <Link
      href={href}
      title={title}
      className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${active ? "border-[#1d4ed8] bg-[#1d4ed8] text-white" : "border-gray-300 bg-white text-gray-700 hover:border-[#1d4ed8]"}`}
    >
      {label} <span className={active ? "text-white/80" : "text-gray-400"}>{count}</span>
    </Link>
  );
}
