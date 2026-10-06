import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDate, formatDateTime, formatDayMonth } from "@/lib/format-time";
import { SiteHeader } from "@/components/SiteHeader";
import { SignOutButton } from "@/components/SignOutButton";
import { ChangePassword } from "@/components/ChangePassword";
import { isConfigured, panelHome, requireUser } from "@/lib/auth";
import { BATTERIES, CATEGORIES } from "@/lib/wt/categories";
import { hiddenBatteries, openToStudents } from "@/lib/wt/visibility";
import { listPublishedPapers } from "@/lib/wt/db";
import { attemptsFor } from "@/lib/wt/history";
import { batteryProgress } from "@/lib/wt/progress";
import {
  currentMockStep,
  listPublishedMocks,
  mockLeaderboard,
  mockResultsFor,
  mockStatus,
  type MockStatus,
} from "@/lib/wt/mock";

/** The bar RRB sets; the dashboard's "below the bar" line. */
const BAR = 42;

/** A tile's look, kept out of the markup so the cards read as one set. */
const TONES: Record<string, { ring: string; chip: string; icon: string }> = {
  watch: { ring: "from-sky-500 to-indigo-600", chip: "bg-sky-50 text-sky-700", icon: "🧭" },
  letter: { ring: "from-emerald-500 to-teal-600", chip: "bg-emerald-50 text-emerald-700", icon: "🔤" },
  number: { ring: "from-amber-500 to-orange-600", chip: "bg-amber-50 text-amber-700", icon: "🔢" },
  figure: { ring: "from-rose-500 to-pink-600", chip: "bg-rose-50 text-rose-700", icon: "🔍" },
  memory: { ring: "from-violet-500 to-purple-600", chip: "bg-violet-50 text-violet-700", icon: "🧠" },
  depth: { ring: "from-cyan-500 to-blue-600", chip: "bg-cyan-50 text-cyan-700", icon: "🧊" },
  observation: { ring: "from-lime-500 to-green-600", chip: "bg-lime-50 text-lime-700", icon: "👁️" },
};

export default async function DashboardPage() {
  if (!isConfigured()) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <SiteHeader />
        <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
          <div className="rounded border border-amber-300 bg-amber-50 p-5 text-[14px] text-amber-900">
            <p className="font-semibold">Accounts are not set up yet.</p>
          </div>
        </main>
      </div>
    );
  }

  const profile = await requireUser();
  // A helper account has one job, and its page is in the panel.
  if (profile.role !== "student" && profile.role !== "admin") redirect(panelHome(profile.role));

  const [allPapers, hidden, history, progress, mocks, mockResults, inMock] = await Promise.all([
    listPublishedPapers(),
    hiddenBatteries(),
    attemptsFor(profile.id, 10),
    batteryProgress(profile.id),
    listPublishedMocks(),
    mockResultsFor(profile.id, 30),
    currentMockStep(profile.id),
  ]);
  // Papers of a battery the admin has not opened yet are not on offer.
  const papers = allPapers.filter((p) => openToStudents(p.category, hidden));
  const visibleBatteries = BATTERIES.filter((b) => !hidden.includes(b.id));

  // The mock to put up top: the one in progress, else the next live or
  // scheduled one not yet attempted, else the newest live one.
  const latestByMock = new Map<string, (typeof mockResults)[number]>();
  for (const r of mockResults) if (!latestByMock.has(r.mockId)) latestByMock.set(r.mockId, r);
  const open = mocks.filter((m) => mockStatus(m) === "live" || mockStatus(m) === "scheduled");
  const featured =
    (inMock && mocks.find((m) => m.id === inMock.mock.id)) ||
    open.find((m) => !latestByMock.has(m.id)) ||
    open[0] ||
    null;

  // The scorecard history, oldest first, for the trend; and the standing in
  // the newest finished mock.
  const trend = mockResults
    .filter((r) => r.composite !== null)
    .slice()
    .reverse()
    .slice(-8);
  const newest = mockResults[0] ?? null;
  const leaders = newest ? await mockLeaderboard(newest.mockId, 5) : [];

  const weakest = progress
    .filter((p) => visibleBatteries.some((b) => b.id === p.battery))
    .slice()
    .sort((a, b) => (a.bestT ?? -1) - (b.bestT ?? -1))[0];
  const streak = practiceStreak(history.map((h) => h.submittedAt));

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6fa]">
      <SiteHeader
        right={
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-white/80">{profile.full_name || "Candidate"}</span>
            <SignOutButton />
          </div>
        }
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-5">
        {/* ------------------------------ Hero ------------------------------ */}
        <section className="rounded-2xl bg-gradient-to-r from-[#0d2a6b] to-[#1d4ed8] px-5 py-5 text-white shadow-lg sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <h1 className="text-[22px] font-bold">
                Welcome{profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} 👋
                <span className="ml-2 text-[14px] font-medium text-blue-100" lang="hi">स्वागत है</span>
              </h1>
              <p className="mt-0.5 text-[12px] text-blue-100">
                {profile.roll_no ? `Roll ${profile.roll_no} · ` : ""}
                {profile.valid_until ? `Valid till ${formatDate(profile.valid_until)}` : "KAUTILYA CLASSES"}
                {streak > 1 && ` · 🔥 ${streak}-day practice streak`}
              </p>
              {featured ? (
                <p className="mt-3 text-[13px]">
                  <b>{inMock && inMock.mock.id === featured.id ? "In progress" : "Next Full Mock"}: {featured.name}</b>
                  {featured.opensAt && mockStatus(featured) === "scheduled" && <> · opens {formatDateTime(featured.opensAt)}</>}
                  {featured.closesAt && mockStatus(featured) === "live" && <> · till {formatDateTime(featured.closesAt)}</>}
                  {featured.maxAttempts !== null && <> · {featured.maxAttempts} attempt{featured.maxAttempts === 1 ? "" : "s"}</>}
                </p>
              ) : (
                <p className="mt-3 text-[13px] text-blue-100">No Full Mock is open right now. Keep up the sectional practice.</p>
              )}
            </div>
            {featured && (
              <div className="shrink-0 sm:text-right">
                <Link
                  href={inMock && inMock.mock.id === featured.id ? `/watch-table/${inMock.paper.slug}` : `/mock/${featured.slug}`}
                  className="inline-block rounded-lg bg-white px-5 py-2.5 text-[14px] font-bold text-[#0d2a6b] shadow hover:bg-blue-50"
                >
                  {inMock && inMock.mock.id === featured.id
                    ? `Continue · Test ${inMock.step + 1} of ${inMock.papers.length} ▶`
                    : mockStatus(featured) === "live"
                      ? `Start ${featured.name} ▶`
                      : `About ${featured.name} →`}
                </Link>
                {latestByMock.get(featured.id) && (
                  <div className="mt-1.5 text-[11px] text-blue-100">
                    Last: {verdictWord(latestByMock.get(featured.id)!.qualified)} · composite {latestByMock.get(featured.id)!.composite?.toFixed(1) ?? "—"}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* --------------------------- Battery tiles --------------------------- */}
        <section className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          {visibleBatteries.map((battery) => {
            const p = progress.find((x) => x.battery === battery.id);
            const t = p?.bestT ?? null;
            const width = t === null ? 0 : Math.max(4, Math.min(100, ((t - 20) / 60) * 100));
            const status =
              t === null
                ? { label: "Not yet attempted", cls: "bg-gray-100 text-gray-600" }
                : t < BAR
                  ? { label: `! Below ${BAR}`, cls: "bg-red-50 text-red-700" }
                  : t < BAR + 5
                    ? { label: "▲ Improve", cls: "bg-amber-50 text-amber-700" }
                    : t < 55
                      ? { label: "✓ Good", cls: "bg-green-50 text-green-700" }
                      : { label: "✓ Strong", cls: "bg-green-50 text-green-700" };
            return (
              <Link
                key={battery.id}
                href={`#battery-${battery.id}`}
                className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="text-[11px] text-gray-500">Test {battery.id}</div>
                <div className="truncate text-[12px] font-bold text-gray-900">{battery.title.replace(" Test", "")}</div>
                <div className="mt-1.5 text-[22px] font-extrabold leading-none text-gray-900">
                  {t === null ? "—" : t.toFixed(0)} <span className="text-[10px] font-semibold text-gray-500">best T</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded bg-gray-100">
                  <div className="h-full rounded bg-[#1d4ed8]" style={{ width: `${width}%` }} />
                </div>
                <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${status.cls}`}>{status.label}</span>
              </Link>
            );
          })}
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_330px]">
          <div className="min-w-0">
            {/* ---------------------------- Full Mocks ---------------------------- */}
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-[14px] font-bold text-gray-900">
                Full Mock Tests <span className="font-normal text-gray-500" lang="hi">/ पूर्ण मॉक टेस्ट</span>
              </h2>
              {mocks.length === 0 && mockResults.length === 0 ? (
                <p className="mt-2 text-[13px] text-gray-500">Full Mocks will appear here when the institute opens them.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {mocks.map((mock) => {
                    const status = mockStatus(mock);
                    const last = latestByMock.get(mock.id);
                    const here = inMock && inMock.mock.id === mock.id;
                    return (
                      <li key={mock.id} className="flex items-center gap-3 rounded-lg border border-gray-200 p-2.5 text-[12px]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef2fb] text-[11px] font-extrabold text-[#0d2a6b]">
                          M{mock.sortOrder || ""}
                        </span>
                        <span className="min-w-0 flex-1">
                          <Link href={`/mock/${mock.slug}`} className="block truncate font-bold text-gray-900 hover:underline">
                            {mock.name}
                          </Link>
                          <span className="block text-[11px] text-gray-500">
                            {last
                              ? <>{formatDayMonth(last.submittedAt)} · T {last.tests.map((t) => (t.tScore === null ? "—" : t.tScore.toFixed(0))).join(" · ")}</>
                              : mockWindow(mock, status)}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          {last && <span className="block text-[14px] font-extrabold text-gray-900">{last.composite?.toFixed(1) ?? "—"}</span>}
                          {here ? (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">⏵ In progress</span>
                          ) : last ? (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              last.qualified === true ? "bg-green-50 text-green-700" : last.qualified === false ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                            }`}>
                              {last.qualified === true ? "✓ Qualified" : last.qualified === false ? `✕ ${failedTest(last.tests, mock.cutOffT)}` : "? Pending"}
                            </span>
                          ) : (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_CLS[status]}`}>{STATUS_LABEL[status]}</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* ------------------------- Sectional practice ------------------------- */}
            <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[14px] font-bold text-gray-900">
                  Sectional practice <span className="font-normal text-gray-500" lang="hi">/ अनुभाग अभ्यास</span>
                </h2>
                <span className="text-[12px] text-gray-500">
                  · {papers.length} papers · {progress.reduce((n, p) => n + p.papersSat, 0)} sat
                </span>
              </div>
              {weakest && (
                <p className="mt-1 text-[12px] text-gray-600">
                  Today&apos;s suggestion: <b>{weakest.title}</b>
                  {weakest.bestT === null ? " — not attempted yet" : ` — best T ${weakest.bestT.toFixed(0)}, your weakest`}
                </p>
              )}
              {visibleBatteries.map((battery) => (
                <div key={battery.id} id={`battery-${battery.id}`} className="mt-4 scroll-mt-4">
                  <h3 className="text-[12px] font-bold uppercase tracking-wide text-gray-500">
                    Test {battery.id} · {battery.title} <span className="font-normal normal-case tracking-normal" lang="hi">· {battery.hindi}</span>
                  </h3>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {CATEGORIES.filter((c) => c.battery === battery.id).map((category) => {
                      const count = papers.filter((p) => p.category === category.id).length;
                      const tone = TONES[category.id];
                      return (
                        <Link
                          key={category.id}
                          href={`/tests/${category.id}`}
                          className="group flex items-center gap-3 rounded-lg border border-gray-200 p-2.5 transition hover:border-[#1d4ed8] hover:shadow-sm"
                        >
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${tone.ring} text-[18px]`} aria-hidden="true">
                            {tone.icon}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-bold text-gray-900">{category.title}</span>
                            <span className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${count ? tone.chip : "bg-gray-100 text-gray-500"}`}>
                              {count === 0 ? "Coming soon" : `${count} test${count === 1 ? "" : "s"}`}
                            </span>
                          </span>
                          <span className="text-gray-300 group-hover:text-[#1d4ed8]" aria-hidden="true">›</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>

            {/* ---------------------------- Past results ---------------------------- */}
            <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-[14px] font-bold text-gray-900">Recent sectional results</h2>
              {history.length === 0 ? (
                <p className="mt-2 text-[13px] text-gray-500">You have not sat a test yet. Pick one above.</p>
              ) : (
                <table className="mt-2 w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-1.5 font-semibold">Test</th>
                      <th className="py-1.5 font-semibold">Score</th>
                      <th className="py-1.5 font-semibold">Date</th>
                      <th className="py-1.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((row) => (
                      <tr key={row.id} className="border-t border-gray-100">
                        <td className="py-1.5 font-semibold text-gray-900">{row.paperName}</td>
                        <td className="py-1.5 tabular-nums">{row.marks} / {row.total}</td>
                        <td className="py-1.5 text-gray-600">{formatDate(row.submittedAt)}</td>
                        <td className="py-1.5 text-right">
                          {row.paperSlug && (
                            <Link href={`/watch-table/${row.paperSlug}/result`} className="font-semibold text-[#1d4ed8] hover:underline">View</Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>

          {/* ------------------------------ Side column ------------------------------ */}
          <aside className="space-y-4">
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-[14px] font-bold text-gray-900">My progress · Composite T-score</h2>
              {trend.length === 0 ? (
                <p className="mt-2 text-[12px] text-gray-500">The graph appears after your first Full Mock.</p>
              ) : (
                <TrendChart points={trend.map((r) => ({ label: r.mockName.replace(/full mock/i, "M").trim(), value: r.composite as number }))} bar={BAR} />
              )}
            </section>

            {newest && leaders.length > 0 && (
              <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="text-[14px] font-bold text-gray-900">
                  Leaderboard · {newest.mockName}
                  <Link href={`/mock/${newest.mockSlug}/result`} className="float-right text-[11px] font-semibold text-[#1d4ed8] hover:underline">Full →</Link>
                </h2>
                <ol className="mt-2 divide-y divide-gray-100">
                  {leaders.map((row) => (
                    <li key={row.userId} className={`flex items-center gap-2 py-1.5 text-[12px] ${row.userId === profile.id ? "-mx-2 rounded-lg bg-blue-50 px-2 font-bold" : ""}`}>
                      <span className="w-5 text-gray-500">{row.rank}</span>
                      <span className="flex-1 truncate text-gray-900">{row.name}{row.userId === profile.id ? " (you)" : ""}</span>
                      <span className="font-bold tabular-nums">{row.composite.toFixed(1)}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {weakest && (
              <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="text-[14px] font-bold text-gray-900">This week&apos;s target</h2>
                <p className="mt-1 text-[12px] text-gray-700">
                  {weakest.bestT === null
                    ? <>Sit your first {weakest.title} paper</>
                    : weakest.bestT < BAR
                      ? <>Cross T {BAR} in {weakest.title}</>
                      : <>Take {weakest.title} up to T {Math.ceil((weakest.bestT + 5) / 5) * 5}</>}
                </p>
                {weakest.bestT !== null && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded bg-gray-100">
                    <div className="h-full rounded bg-[#1d4ed8]" style={{ width: `${Math.max(4, Math.min(100, ((weakest.bestT - 20) / 60) * 100))}%` }} />
                  </div>
                )}
                <Link href={`#battery-${weakest.battery}`} className="mt-2 inline-block text-[12px] font-semibold text-[#1d4ed8] hover:underline">
                  Practise now →
                </Link>
              </section>
            )}

            {profile.phone && <ChangePassword phone={profile.phone} />}
          </aside>
        </div>
      </main>
    </div>
  );
}

const STATUS_LABEL: Record<MockStatus, string> = { draft: "Draft", scheduled: "⏱ Upcoming", live: "● Live", closed: "Closed" };
const STATUS_CLS: Record<MockStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  scheduled: "bg-blue-50 text-blue-700",
  live: "bg-green-50 text-green-700",
  closed: "bg-gray-100 text-gray-600",
};

function mockWindow(mock: { opensAt: string | null; closesAt: string | null }, status: MockStatus): string {
  if (status === "scheduled" && mock.opensAt) return `Opens ${formatDateTime(mock.opensAt)}`;
  if (status === "live" && mock.closesAt) return `Till ${formatDateTime(mock.closesAt)}`;
  if (status === "closed") return "Over";
  return "Open now";
}

function verdictWord(q: boolean | null): string {
  return q === true ? "Qualified" : q === false ? "Not qualified" : "Pending";
}

/** "Test 3 < 42": the first battery that missed the bar. */
function failedTest(tests: { battery: number; cleared: boolean | null }[], bar: number): string {
  const miss = tests.filter((t) => t.cleared === false).map((t) => t.battery);
  if (miss.length === 0) return "Not qualified";
  return miss.length === 1 ? `Test ${miss[0]} < ${bar}` : `Tests ${miss.join(", ")} < ${bar}`;
}

/** Consecutive days, ending today or yesterday, with at least one paper sat. */
function practiceStreak(dates: string[]): number {
  const days = new Set(dates.map((d) => new Date(d).toISOString().slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  if (!days.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** The composite T-score, mock by mock, with the qualifying bar drawn across. */
function TrendChart({ points, bar }: { points: { label: string; value: number }[]; bar: number }) {
  const W = 296;
  const H = 120;
  const left = 30;
  const right = W - 8;
  const top = 14;
  const bottom = H - 24;
  const lo = Math.min(30, ...points.map((p) => p.value)) - 2;
  const hi = Math.max(60, ...points.map((p) => p.value)) + 2;
  const y = (v: number) => bottom - ((v - lo) / (hi - lo)) * (bottom - top);
  const x = (i: number) => (points.length === 1 ? (left + right) / 2 : left + (i / (points.length - 1)) * (right - left));
  const last = points[points.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 h-auto w-full" role="img" aria-label="Composite T-score by mock">
      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#e6e9ef" />
      <line x1={left} y1={y(bar)} x2={right} y2={y(bar)} stroke="#9ca3af" strokeDasharray="3 3" />
      <text x={0} y={y(bar) + 4} fontSize="10" fill="#8a94a6">T {bar}</text>
      <polyline
        points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ")}
        fill="none"
        stroke="#1d4ed8"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.value)} r="4" fill={i === points.length - 1 ? "#1d4ed8" : "#fff"} stroke="#1d4ed8" strokeWidth="2" />
          <text x={x(i)} y={H - 8} fontSize="10" fill="#8a94a6" textAnchor="middle">{p.label}</text>
        </g>
      ))}
      <text x={x(points.length - 1)} y={y(last.value) - 8} fontSize="11" fontWeight="700" fill="#0b1220" textAnchor="end">
        {last.value.toFixed(1)}
      </text>
    </svg>
  );
}
