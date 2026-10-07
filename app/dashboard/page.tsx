import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDate, formatDateTime, formatDayMonth, indianDay } from "@/lib/format-time";
import { daysUntil, examSettings } from "@/lib/settings";
import { activeNotices, listNotices } from "@/lib/notices";
import { SiteHeader } from "@/components/SiteHeader";
import { StudentHeader } from "@/components/StudentHeader";
import { photoUrlOf } from "@/lib/photo";
import { isConfigured, panelHome, requireUser } from "@/lib/auth";
import { BATTERIES, CATEGORIES } from "@/lib/wt/categories";
import { hiddenBatteries, openToStudents } from "@/lib/wt/visibility";
import { listPublishedPapers, type PaperSummary } from "@/lib/wt/db";
import { allowancesFor, type AttemptAllowance } from "@/lib/wt/attempts";
import { attemptsFor } from "@/lib/wt/history";
import { batteryProgress, type BatteryProgress } from "@/lib/wt/progress";
import { planFor, readiness, STAGES, type PlanRow } from "@/lib/wt/plan";
import {
  currentMockStep,
  listPublishedMocks,
  mockLeaderboard,
  mockResultsFor,
  mockStatus,
  mocksFinishedToday,
  scoreOutOf30,
  type MockStatus,
} from "@/lib/wt/mock";

/** A tile's look, kept out of the markup so the cards read as one set. */
const TONES: Record<string, { ring: string; chip: string; icon: string; soft: string }> = {
  watch: { ring: "from-sky-500 to-indigo-600", chip: "bg-sky-50 text-sky-700", icon: "🧭", soft: "bg-sky-50" },
  letter: { ring: "from-emerald-500 to-teal-600", chip: "bg-emerald-50 text-emerald-700", icon: "🔤", soft: "bg-emerald-50" },
  number: { ring: "from-amber-500 to-orange-600", chip: "bg-amber-50 text-amber-700", icon: "🔢", soft: "bg-amber-50" },
  figure: { ring: "from-rose-500 to-pink-600", chip: "bg-rose-50 text-rose-700", icon: "🔍", soft: "bg-rose-50" },
  memory: { ring: "from-violet-500 to-purple-600", chip: "bg-violet-50 text-violet-700", icon: "🧠", soft: "bg-violet-50" },
  depth: { ring: "from-cyan-500 to-blue-600", chip: "bg-cyan-50 text-cyan-700", icon: "🧊", soft: "bg-cyan-50" },
  observation: { ring: "from-lime-500 to-green-600", chip: "bg-lime-50 text-lime-700", icon: "👁️", soft: "bg-lime-50" },
};
const BATTERY_ICON: Record<number, string> = { 1: "🧠", 2: "🧭", 3: "🧊", 4: "👁️", 5: "🔍" };
const BATTERY_SOFT: Record<number, string> = { 1: "bg-violet-50", 2: "bg-sky-50", 3: "bg-cyan-50", 4: "bg-lime-50", 5: "bg-rose-50" };

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

  const now = Date.now();
  const today = indianDay(now);
  const dayStart = new Date(`${today}T00:00:00+05:30`).toISOString();

  const notices = activeNotices(await listNotices(), today);
  const [allPapers, hidden, history, progress, mocks, mockResults, inMock, exam, mocksToday] = await Promise.all([
    listPublishedPapers(),
    hiddenBatteries(),
    attemptsFor(profile.id, 10),
    batteryProgress(profile.id),
    listPublishedMocks(),
    mockResultsFor(profile.id, 30),
    currentMockStep(profile.id),
    examSettings(),
    mocksFinishedToday(profile.id, dayStart),
  ]);
  const stages = { pass: exam.passT, average: STAGES.average, target: exam.targetT };
  const daysLeft = exam.examDate ? daysUntil(exam.examDate, today) : null;

  // Papers of a battery the admin has not opened yet are not on offer.
  const papers = allPapers.filter((p) => openToStudents(p.category, hidden));
  const allowances = await allowancesFor(papers, profile.id);
  const visibleBatteries = BATTERIES.filter((b) => !hidden.includes(b.id));
  const inPlay = progress.filter((p) => visibleBatteries.some((b) => b.id === p.battery));

  // The day's plan, from the institute's rule; each row gets the next paper
  // to open: one not yet sat today with attempts left, the least-sat first.
  const plan = planFor(
    inPlay.map((p) => ({ battery: p.battery, title: p.title, bestT: p.bestT, today: p.today, lastAt: p.lastAt })),
    mocksToday,
    now,
    stages,
  );
  const nextPaper = (row: PlanRow): { paper: PaperSummary; allowance: AttemptAllowance } | null => {
    const prog = progress.find((p) => p.battery === row.battery);
    const ids: string[] = CATEGORIES.filter((c) => c.battery === row.battery).map((c) => c.id);
    const candidates = papers
      .filter((p) => ids.includes(p.category))
      .map((paper) => ({ paper, allowance: allowances.get(paper.slug)! }))
      .filter(({ allowance }) => !allowance.exhausted)
      .sort((a, b) => {
        const aToday = prog?.todayPapers.includes(a.paper.id) ? 1 : 0;
        const bToday = prog?.todayPapers.includes(b.paper.id) ? 1 : 0;
        return aToday - bToday || a.allowance.used - b.allowance.used || a.paper.sortOrder - b.paper.sortOrder;
      });
    return candidates[0] ?? null;
  };
  const focus = plan.rows.find((r) => !r.keepSharp && r.done < r.target) ?? plan.rows.find((r) => r.due) ?? null;
  const focusNext = focus ? nextPaper(focus) : null;

  const passed = inPlay.filter((p) => p.bestT !== null && p.bestT >= stages.pass).length;
  const atTarget = inPlay.filter((p) => p.bestT !== null && p.bestT >= stages.target).length;
  const ready = readiness(inPlay.map((p) => p.bestT), stages.target);
  const overallStage = inPlay.some((p) => p.bestT === null || p.bestT < stages.pass)
    ? 1
    : inPlay.some((p) => p.bestT! < stages.average)
      ? 2
      : inPlay.some((p) => p.bestT! < stages.target)
        ? 3
        : 4;

  // Mocks: the one in progress, else the next open one.
  const latestByMock = new Map<string, (typeof mockResults)[number]>();
  for (const r of mockResults) if (!latestByMock.has(r.mockId)) latestByMock.set(r.mockId, r);
  const openMocks = mocks.filter((m) => mockStatus(m) === "live" || mockStatus(m) === "scheduled");
  const featured = (inMock && mocks.find((m) => m.id === inMock.mock.id)) || openMocks.find((m) => !latestByMock.has(m.id)) || openMocks[0] || null;
  const newest = mockResults[0] ?? null;
  const leaders = newest ? await mockLeaderboard(newest.mockId, 5) : [];
  const trend = mockResults.filter((r) => r.composite !== null).slice().reverse().slice(-8);

  return (
    <div className="flex min-h-screen flex-col bg-[#f3f5f9]">
      <StudentHeader name={profile.full_name || "Candidate"} photoUrl={photoUrlOf(profile)} active="dashboard" />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-5">
        {notices.length > 0 && (
          <section className="mb-4 rounded-[14px] border border-amber-300 bg-amber-50 px-4 py-3 shadow-sm" aria-label="Notices">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-amber-800">
              📢 Notice board <span className="font-semibold normal-case tracking-normal" lang="hi">/ सूचना पट्ट</span>
            </h2>
            <ul className="mt-1.5 space-y-1.5">
              {notices.map((n) => (
                <li key={n.id} className="text-[13px] text-amber-950">
                  {n.en && <span className="block">{n.en}</span>}
                  {n.hi && <span className="block text-[12px] text-amber-900" lang="hi">{n.hi}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}
        {/* ------------------------------ Hero ------------------------------ */}
        <section
          className="relative overflow-hidden rounded-[20px] px-6 py-6 text-white shadow-[0_14px_34px_rgba(13,42,107,0.28)] sm:px-7"
          style={{ background: "linear-gradient(135deg,#0b1f52 0%,#0d2a6b 45%,#1a44b8 100%)" }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M40 0H0v40' fill='none' stroke='%23ffffff' stroke-opacity='.06'/%3E%3C/svg%3E\")" }}
            aria-hidden="true"
          />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_230px]">
            <div>
              <div className="text-[10.5px] font-bold tracking-[0.24em] text-[#93c5fd]">
                RRB ALP CBAT
                {exam.examDate && (
                  <>
                    {" "}&nbsp;·&nbsp; EXAM DATE <b className="text-[12px] text-white">{formatDate(exam.examDate).toUpperCase()}</b>
                  </>
                )}
              </div>
              <h1 className="mt-1.5 text-[26px] font-extrabold tracking-tight sm:text-[28px]">
                Welcome{profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {[
                  { n: 1, label: "Stage 1 · Pass", t: stages.pass },
                  { n: 2, label: "Stage 2 · Average", t: stages.average },
                  { n: 3, label: "Stage 3 · Target", t: stages.target },
                ].map((s, i) => (
                  <span key={s.n} className="flex items-center gap-2">
                    {i > 0 && <span className="text-[16px] text-[#93c5fd]" aria-hidden="true">›</span>}
                    <span
                      className={`rounded-full border px-3 py-1.5 text-[11.5px] ${
                        overallStage > s.n
                          ? "border-[#4ade80] text-[#bbf7d0]"
                          : overallStage === s.n
                            ? "border-white bg-white font-semibold text-[#0d2a6b]"
                            : "border-white/20 bg-white/[0.08] text-[#c9d8ff]"
                      }`}
                    >
                      {overallStage > s.n ? "✓ " : ""}{s.label} <b className={overallStage === s.n ? "text-[#0d2a6b]" : "text-white"}>T-Score: {s.t}</b>
                    </span>
                  </span>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <HeroStat big={daysLeft === null ? "—" : daysLeft < 0 ? "0" : String(daysLeft)} label={daysLeft !== null && daysLeft === 0 ? "exam day is today" : "days to the exam"} />
                <HeroStat big={String(passed)} suffix={`/${inPlay.length}`} label={`batteries passed · ${stages.pass}+`} />
                <HeroStat big={String(atTarget)} suffix={`/${inPlay.length}`} label={`at target · ${stages.target}+`} />
                <HeroStat
                  big={newest && scoreOutOf30(newest.tests) !== null ? scoreOutOf30(newest.tests)!.toFixed(1) : "—"}
                  suffix={newest ? "/30" : ""}
                  label={newest ? `last Full Mock · ${newest.mockName}` : "no Full Mock yet"}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2.5">
                {inMock ? (
                  <Link href={`/test/${inMock.paper.slug}`} className="rounded-[10px] bg-white px-4 py-2.5 text-[13.5px] font-bold text-[#0d2a6b] shadow-lg hover:bg-blue-50">
                    ▶ Continue {inMock.mock.name} · Test {inMock.step + 1} of {inMock.papers.length}
                  </Link>
                ) : focus && focusNext ? (
                  <Link href={`/test/${focusNext.paper.slug}`} className="rounded-[10px] bg-white px-4 py-2.5 text-[13.5px] font-bold text-[#0d2a6b] shadow-lg hover:bg-blue-50">
                    ▶ Start today&apos;s plan · {focus.title.replace(" Test", "")}
                  </Link>
                ) : (
                  <Link href="#practice" className="rounded-[10px] bg-white px-4 py-2.5 text-[13.5px] font-bold text-[#0d2a6b] shadow-lg hover:bg-blue-50">
                    ▶ Sectional practice
                  </Link>
                )}
                {featured && !inMock && (
                  plan.mocksUnlocked ? (
                    <Link href={`/mock/${featured.slug}`} className="rounded-[10px] border border-white/35 bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-white/20">
                      {mockStatus(featured) === "live" ? `Start ${featured.name}` : `${featured.name} · opens ${featured.opensAt ? formatDateTime(featured.opensAt) : "soon"}`}
                    </Link>
                  ) : (
                    <span className="rounded-[10px] border border-white/35 bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white/90">
                      🔒 Full Mock unlocks when every battery is {stages.pass}+
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center lg:border-l lg:border-white/15 lg:pl-5">
              <Gauge percent={ready} />
              <p className="mt-2 text-center text-[11px] leading-relaxed text-[#c9d8ff]">
                Readiness: the five batteries against <b className="text-white">T-Score: {stages.target}</b>.
              </p>
            </div>
          </div>
        </section>

        {/* ---------------------------- Today's plan ---------------------------- */}
        <section className="mt-4 rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm sm:p-5" id="plan">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[14px] font-bold text-gray-900">
              Today&apos;s plan <span className="font-normal text-gray-500" lang="hi">/ आज का प्लान</span>
              <span className="ml-1 font-normal text-gray-500">· {formatDate(now)}</span>
            </h2>
            <div className="text-[12px] text-gray-600">
              <b className="text-gray-900">{plan.sectionalDone} / {plan.sectionalTarget}</b> sectional tests done
              {" · "}Full Mock{" "}
              <b className="text-gray-900">{plan.mocksUnlocked ? `${mocksToday} / ${plan.mocksTarget}` : "locked"}</b>
            </div>
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded bg-[#eef1f6]">
            <div
              className="h-full rounded"
              style={{
                width: `${plan.sectionalTarget ? Math.min(100, (plan.sectionalDone / plan.sectionalTarget) * 100) : 100}%`,
                background: "linear-gradient(90deg,#1d4ed8,#3b82f6)",
              }}
            />
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="text-left text-[10px] font-bold text-gray-500">
                  <th className="px-2 py-1.5">Battery</th>
                  <th className="px-2 py-1.5">Now</th>
                  <th className="px-2 py-1.5">Stage</th>
                  <th className="px-2 py-1.5">Today</th>
                  <th className="px-2 py-1.5">Progress</th>
                  <th className="px-2 py-1.5" />
                </tr>
              </thead>
              <tbody>
                {plan.rows.map((row) => {
                  const next = nextPaper(row);
                  const hot = focus?.battery === row.battery;
                  const tone = row.bestT === null ? "text-gray-400" : row.bestT < stages.pass ? "text-red-700" : row.bestT < stages.target ? "text-amber-700" : "text-green-700";
                  const pct = row.keepSharp ? 100 : row.target ? Math.min(100, (row.done / row.target) * 100) : 0;
                  return (
                    <tr key={row.battery} className={`border-t border-gray-100 ${hot ? "bg-[#f3f6ff]" : ""} ${row.keepSharp && !row.due ? "text-gray-500" : ""}`}>
                      <td className={`px-2 py-2.5 font-bold text-gray-900 ${hot ? "border-l-[3px] border-[#1d4ed8]" : ""}`}>
                        Test {row.battery} · {row.title.replace(" Test", "")}
                      </td>
                      <td className={`px-2 py-2.5 font-bold tabular-nums ${tone}`}>{row.bestT === null ? "—" : row.bestT.toFixed(0)}</td>
                      <td className="px-2 py-2.5"><StageChip row={row} stages={stages} /></td>
                      <td className="px-2 py-2.5 whitespace-nowrap">
                        {row.keepSharp ? (row.due ? <b>1 test</b> : "keep sharp") : <><b>{row.target}</b> test{row.target === 1 ? "" : "s"}</>}
                      </td>
                      <td className="px-2 py-2.5 whitespace-nowrap">
                        <span className="mr-1.5 inline-block h-1.5 w-[70px] overflow-hidden rounded bg-[#eef1f6] align-middle">
                          <span className={`block h-full rounded ${row.keepSharp && !row.due ? "bg-green-600" : "bg-[#1d4ed8]"}`} style={{ width: `${pct}%` }} />
                        </span>
                        <span className="text-[11px] text-gray-600">
                          {row.keepSharp && !row.due ? "✓" : `${row.done} / ${row.keepSharp ? 1 : row.target}`}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 whitespace-nowrap">
                        {next ? (
                          <Link href={`/test/${next.paper.slug}`} className="font-bold text-[#1d4ed8] hover:underline">
                            {row.keepSharp && !row.due ? "1 test every 3 days" : "Start"} · {next.paper.displayName}
                            {next.allowance.max !== null && (
                              <span className="font-normal text-gray-500"> ({next.allowance.remaining} of {next.allowance.max} attempts left)</span>
                            )}
                            {" →"}
                          </Link>
                        ) : (
                          <span className="text-gray-400">No paper with attempts left</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t border-gray-100 bg-[#fafafa]">
                  <td className="px-2 py-2.5 font-bold text-gray-900">Full Mock Tests</td>
                  <td className="px-2 py-2.5" colSpan={2}>
                    {plan.mocksUnlocked ? (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">Open · every battery {stages.pass}+</span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">🔒 Locked · {passed} of {inPlay.length} batteries at {stages.pass}+</span>
                    )}
                  </td>
                  <td className="px-2 py-2.5 whitespace-nowrap">{plan.mocksUnlocked ? <><b>2</b> / day</> : <><b>2</b> / day once open</>}</td>
                  <td className="px-2 py-2.5 whitespace-nowrap">
                    <span className="mr-1.5 inline-block h-1.5 w-[70px] overflow-hidden rounded bg-[#eef1f6] align-middle">
                      <span className="block h-full rounded bg-[#1d4ed8]" style={{ width: `${plan.mocksUnlocked ? Math.min(100, (mocksToday / 2) * 100) : 0}%` }} />
                    </span>
                    <span className="text-[11px] text-gray-600">{mocksToday} / 2</span>
                  </td>
                  <td className="px-2 py-2.5 whitespace-nowrap">
                    {plan.mocksUnlocked && featured ? (
                      <Link href={`/mock/${featured.slug}`} className="font-bold text-[#1d4ed8] hover:underline">Open · {featured.name} →</Link>
                    ) : plan.mocksUnlocked ? (
                      <span className="text-gray-400">No Full Mock open right now</span>
                    ) : (
                      <span className="text-gray-500">
                        Get {plan.rows.filter((r) => r.stage === 1).map((r) => r.title.replace(" Test", "")).join(", ")} to {stages.pass} to unlock
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* --------------------------- Battery tiles --------------------------- */}
        <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {visibleBatteries.map((battery) => {
            const p = progress.find((x) => x.battery === battery.id) as BatteryProgress;
            const t = p?.bestT ?? null;
            const hot = focus?.battery === battery.id;
            return (
              <div
                key={battery.id}
                className={`relative rounded-[14px] border bg-white p-3.5 shadow-sm ${hot ? "border-2 border-[#1d4ed8] shadow-[0_6px_18px_rgba(29,78,216,0.18)]" : "border-gray-200"}`}
              >
                {hot && (
                  <span className="absolute -top-2.5 right-3 rounded-full bg-[#1d4ed8] px-2 py-0.5 text-[9px] font-extrabold text-white">FOCUS TODAY</span>
                )}
                <div className="flex items-center gap-2">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-[9px] text-[15px] ${BATTERY_SOFT[battery.id]}`} aria-hidden="true">{BATTERY_ICON[battery.id]}</span>
                  <span>
                    <span className="block text-[10px] text-gray-500">Test {battery.id}</span>
                    <span className="block text-[12px] font-bold leading-tight text-gray-900">{battery.title.replace(" Test", "")}</span>
                  </span>
                </div>
                <div className="mt-2 text-[26px] font-extrabold leading-none text-gray-900">
                  {t === null ? "—" : t.toFixed(0)} <span className="text-[10px] font-semibold text-gray-500">best T-Score</span>
                </div>
                <div className="mt-2"><StageChip row={{ ...stageRow(t, stages) }} stages={stages} /></div>
                <StageBar t={t} stages={stages} />

                <div className="mt-2.5 border-t border-dashed border-gray-200 pt-2">
                  <div className="flex justify-between text-[10px] font-semibold text-gray-500"><span>Last 3 days</span><span>T-Score</span></div>
                  {p?.days.map((d, i) => {
                    const scale = (v: number) => Math.max(0, Math.min(100, ((v - 20) / 60) * 100));
                    return (
                      <div key={d.day} className="mt-1.5 grid grid-cols-[40px_1fr_26px] items-center gap-1.5 text-[10px] text-gray-600">
                        <span>{i === 2 ? "Today" : formatDayMonth(`${d.day}T12:00:00+05:30`)}</span>
                        <span className="relative block h-1.5 rounded bg-[#eef1f6]">
                          {d.bestT !== null && <span className="absolute left-0 top-0 h-full rounded bg-[#1d4ed8]" style={{ width: `${Math.max(3, scale(d.bestT))}%` }} />}
                          <span className="absolute -top-0.5 h-2.5 w-0.5 bg-red-400" style={{ left: `${scale(stages.pass)}%` }} title={`Pass ${stages.pass}`} />
                          <span className="absolute -top-0.5 h-2.5 w-0.5 bg-green-600" style={{ left: `${scale(stages.target)}%` }} title={`Target ${stages.target}`} />
                        </span>
                        <b className={`text-right ${d.bestT === null ? "font-medium text-gray-400" : "text-gray-900"}`}>{d.bestT === null ? "—" : d.bestT.toFixed(0)}</b>
                      </div>
                    );
                  })}
                  <div className="mt-1.5 text-[9px] text-gray-500">
                    {(() => {
                      const seen = (p?.days ?? []).filter((d) => d.bestT !== null);
                      if (seen.length >= 2) {
                        const delta = (seen[seen.length - 1].bestT as number) - (seen[0].bestT as number);
                        return `${delta >= 0 ? "📈 +" : "📉 "}${delta.toFixed(0)} over ${seen.length} days · ${p.today} today`;
                      }
                      return p?.attempts ? `${p.attempts} attempt${p.attempts === 1 ? "" : "s"} · ${p.papersSat} paper${p.papersSat === 1 ? "" : "s"}` : "Start with one paper today";
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_330px]">
          <div className="min-w-0">
            {/* ---------------------------- Full Mocks ---------------------------- */}
            <section className="rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm sm:p-5" id="mocks">
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
                    const out30 = last ? scoreOutOf30(last.tests) : null;
                    return (
                      <li key={mock.id} className="flex items-center gap-3 rounded-[12px] border border-gray-200 p-3 text-[12px]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#eef2fb] to-[#dbe7ff] text-[11px] font-extrabold text-[#0d2a6b]">
                          M{mock.sortOrder || ""}
                        </span>
                        <span className="min-w-0 flex-1">
                          <Link href={`/mock/${mock.slug}`} className="block truncate font-bold text-gray-900 hover:underline">{mock.name}</Link>
                          <span className="block text-[11px] text-gray-500">
                            {last
                              ? <>{formatDayMonth(last.submittedAt)} · T-Score {last.tests.map((t) => (t.tScore === null ? "—" : t.tScore.toFixed(0))).join(" · ")}</>
                              : mockWindow(mock, status)}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          {last && (
                            <span className="block text-[15px] font-extrabold text-gray-900">
                              {out30 === null ? "—" : out30.toFixed(1)}<span className="text-[10px] font-semibold text-gray-500"> / 30</span>
                            </span>
                          )}
                          {here ? (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">⏵ In progress</span>
                          ) : last ? (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${last.qualified === true ? "bg-green-50 text-green-700" : last.qualified === false ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                              {last.qualified === true ? "✓ Qualified" : last.qualified === false ? `✕ ${failedTest(last.tests, mock.cutOffT)}` : "? Pending"}
                            </span>
                          ) : !plan.mocksUnlocked ? (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">🔒 Locked</span>
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
            <section className="mt-4 rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm sm:p-5" id="practice">
              <h2 className="text-[14px] font-bold text-gray-900">
                Sectional practice <span className="font-normal text-gray-500" lang="hi">/ अनुभाग अभ्यास</span>
                <span className="ml-1 font-normal text-gray-500">· {papers.length} papers · {progress.reduce((n, p) => n + p.papersSat, 0)} sat</span>
              </h2>
              {visibleBatteries.map((battery) => (
                <div key={battery.id} id={`battery-${battery.id}`} className="mt-4 scroll-mt-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                    Test {battery.id} · {battery.title} <span className="font-normal normal-case tracking-normal" lang="hi">· {battery.hindi}</span>
                  </h3>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {CATEGORIES.filter((c) => c.battery === battery.id).map((category) => {
                      const count = papers.filter((p) => p.category === category.id).length;
                      const tone = TONES[category.id];
                      return (
                        <Link key={category.id} href={`/tests/${category.id}`} className="group flex items-center gap-3 rounded-[12px] border border-gray-200 p-2.5 transition hover:border-[#1d4ed8] hover:shadow-sm">
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br ${tone.ring} text-[17px]`} aria-hidden="true">{tone.icon}</span>
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
            <section className="mt-4 rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm sm:p-5" id="results">
              <h2 className="text-[14px] font-bold text-gray-900">Recent sectional results</h2>
              {history.length === 0 ? (
                <p className="mt-2 text-[13px] text-gray-500">You have not sat a test yet. Pick one from today&apos;s plan.</p>
              ) : (
                <table className="mt-2 w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="text-left text-gray-500"><th className="py-1.5 font-semibold">Test</th><th className="py-1.5 font-semibold">Score</th><th className="py-1.5 font-semibold">Date</th><th className="py-1.5" /></tr>
                  </thead>
                  <tbody>
                    {history.map((row) => (
                      <tr key={row.id} className="border-t border-gray-100">
                        <td className="py-1.5 font-semibold text-gray-900">{row.paperName}</td>
                        <td className="py-1.5 tabular-nums">{row.marks} / {row.total}</td>
                        <td className="py-1.5 text-gray-600">{formatDate(row.submittedAt)}</td>
                        <td className="py-1.5 text-right">{row.paperSlug && <Link href={`/test/${row.paperSlug}/result`} className="font-semibold text-[#1d4ed8] hover:underline">View</Link>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>

          {/* ------------------------------ Side column ------------------------------ */}
          <aside className="space-y-4">
            <section className="rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-[14px] font-bold text-gray-900">My progress <span className="font-normal text-gray-500">· Composite T-Score</span></h2>
              {trend.length === 0 ? (
                <p className="mt-2 text-[12px] text-gray-500">The graph appears after your first Full Mock. Red line: pass (T-Score: {stages.pass}). Green line: target (T-Score: {stages.target}).</p>
              ) : (
                <TrendChart
                  points={trend.map((r) => ({ label: r.mockName.replace(/full mock/i, "M").trim(), value: r.composite as number, at: new Date(r.submittedAt).getTime() }))}
                  bar={stages.pass}
                  target={stages.target}
                  examAt={exam.examDate ? new Date(`${exam.examDate}T09:00:00+05:30`).getTime() : null}
                />
              )}
            </section>

            <section className="rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-[14px] font-bold text-gray-900">
                Road to T-Score: {stages.target} <span className="font-normal text-gray-500" lang="hi">/ लक्ष्य</span>
              </h2>
              <ul className="mt-1 divide-y divide-gray-100">
                {inPlay.slice().sort((a, b) => (a.bestT ?? -1) - (b.bestT ?? -1)).map((p) => {
                  const gap = p.bestT === null ? null : Math.max(0, stages.target - p.bestT);
                  const pct = p.bestT === null ? 0 : Math.max(4, Math.min(100, ((p.bestT - 20) / (stages.target - 20)) * 100));
                  return (
                    <li key={p.battery} className="py-2 text-[12px]">
                      <div className="flex items-center gap-2">
                        <Link href={`#battery-${p.battery}`} className="flex-1 truncate font-semibold text-gray-900 hover:underline">Test {p.battery} · {p.title.replace(" Test", "")}</Link>
                        <span className={`shrink-0 font-bold tabular-nums ${gap === 0 ? "text-green-700" : p.bestT !== null && p.bestT < stages.pass ? "text-red-700" : gap === null ? "text-gray-400" : "text-amber-700"}`}>
                          {p.bestT === null || gap === null ? "not sat" : gap === 0 ? "✓ done" : `+${gap.toFixed(0)} to go`}
                        </span>
                      </div>
                      <div className="mt-1 h-1 rounded bg-[#eef1f6]"><div className={`h-full rounded ${gap === 0 ? "bg-green-600" : "bg-[#1d4ed8]"}`} style={{ width: `${pct}%` }} /></div>
                    </li>
                  );
                })}
              </ul>
            </section>

            {newest && leaders.length > 0 && (
              <section className="rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="text-[14px] font-bold text-gray-900">
                  Leaderboard <span className="font-normal text-gray-500">· {newest.mockName}</span>
                  <Link href={`/mock/${newest.mockSlug}/result`} className="float-right text-[11px] font-semibold text-[#1d4ed8] hover:underline">Full →</Link>
                </h2>
                <ol className="mt-2 divide-y divide-gray-100">
                  {leaders.map((row) => (
                    <li key={row.userId} className={`flex items-center gap-2 py-1.5 text-[12px] ${row.userId === profile.id ? "-mx-2 rounded-lg bg-blue-50 px-2 font-bold" : ""}`}>
                      <span className="w-5 text-gray-500">{row.rank}</span>
                      <span className="flex-1 truncate text-gray-900">{row.name}{row.userId === profile.id ? " (you)" : ""}</span>
                      <span className="whitespace-nowrap font-bold tabular-nums">{((row.composite * 5) / 400 * 30).toFixed(1)} / 30</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                {photoUrlOf(profile) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrlOf(profile) ?? ""} alt="" className="h-12 w-12 rounded-full border border-gray-300 object-cover" />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#1d4ed8] to-[#0d2a6b] text-[16px] font-bold text-white" aria-hidden="true">
                    {(profile.full_name?.trim()[0] ?? "S").toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-bold text-gray-900">{profile.full_name || "Candidate"}</div>
                  <div className="text-[11px] text-gray-500">{profile.roll_no ? `Roll ${profile.roll_no} · ` : ""}{profile.phone}</div>
                </div>
              </div>
              <Link href="/profile" className="mt-3 block rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-center text-[12px] font-semibold text-gray-800 hover:bg-gray-50">
                Edit profile · photo, name, password →
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

const STATUS_LABEL: Record<MockStatus, string> = { draft: "Draft", scheduled: "⏱ Upcoming", live: "● Live", closed: "Closed" };
const STATUS_CLS: Record<MockStatus, string> = { draft: "bg-gray-100 text-gray-600", scheduled: "bg-blue-50 text-blue-700", live: "bg-green-50 text-green-700", closed: "bg-gray-100 text-gray-600" };

function mockWindow(mock: { opensAt: string | null; closesAt: string | null }, status: MockStatus): string {
  if (status === "scheduled" && mock.opensAt) return `Opens ${formatDateTime(mock.opensAt)}`;
  if (status === "live" && mock.closesAt) return `Till ${formatDateTime(mock.closesAt)}`;
  if (status === "closed") return "Over";
  return "Open now";
}

/** "Test 3 < 42": the batteries that missed the bar. */
function failedTest(tests: { battery: number; cleared: boolean | null }[], bar: number): string {
  const miss = tests.filter((t) => t.cleared === false).map((t) => t.battery);
  if (miss.length === 0) return "Not qualified";
  return miss.length === 1 ? `Test ${miss[0]} < ${bar}` : `Tests ${miss.join(", ")} < ${bar}`;
}

type Stages = { pass: number; average: number; target: number };

function stageRow(t: number | null, s: Stages): Pick<PlanRow, "bestT" | "stage" | "next" | "keepSharp"> {
  if (t === null || t < s.pass) return { bestT: t, stage: 1, next: s.pass, keepSharp: false };
  if (t < s.average) return { bestT: t, stage: 2, next: s.average, keepSharp: false };
  if (t < s.target) return { bestT: t, stage: 3, next: s.target, keepSharp: false };
  return { bestT: t, stage: 4, next: null, keepSharp: true };
}

function StageChip({ row, stages }: { row: Pick<PlanRow, "bestT" | "stage" | "next" | "keepSharp">; stages: Stages }) {
  if (row.bestT === null) return <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">Not attempted · start Stage 1</span>;
  if (row.keepSharp) return <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">Target reached · T-Score: {stages.target}+</span>;
  const cls = row.stage === 1 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700";
  const gap = Math.max(1, Math.ceil((row.next as number) - row.bestT));
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>
      Stage {row.stage} · {gap} to {row.stage === 1 ? "pass" : ""} T-Score: {row.next}
    </span>
  );
}

/** Three segments, one per stage, filled as far as the best T-score reaches. */
function StageBar({ t, stages }: { t: number | null; stages: Stages }) {
  const fill = (lo: number, hi: number) => (t === null ? 0 : Math.max(0, Math.min(1, (t - lo) / (hi - lo))));
  const segs = [fill(30, stages.pass), fill(stages.pass, stages.average), fill(stages.average, stages.target)];
  return (
    <div className="mt-2">
      <div className="flex gap-[3px]">
        {segs.map((f, i) => (
          <span key={i} className="relative block h-[5px] flex-1 overflow-hidden rounded bg-[#eef1f6]">
            <span className={`absolute left-0 top-0 h-full rounded ${f >= 1 ? "bg-green-600" : "bg-[#1d4ed8]"}`} style={{ width: `${f * 100}%` }} />
          </span>
        ))}
      </div>
      <div className="mt-0.5 flex justify-between text-[9px] text-gray-500"><span>{stages.pass}</span><span>{stages.average}</span><span>{stages.target}</span></div>
    </div>
  );
}

function HeroStat({ big, suffix = "", label }: { big: string; suffix?: string; label: string }) {
  return (
    <div className="rounded-[12px] border border-white/15 bg-white/[0.08] px-3.5 py-3">
      <div className="text-[24px] font-extrabold leading-none">
        {big}{suffix && <span className="text-[12px] font-bold text-[#93c5fd]">{suffix}</span>}
      </div>
      <div className="mt-1.5 text-[11px] text-[#c9d8ff]">{label}</div>
    </div>
  );
}

function Gauge({ percent }: { percent: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-[140px] w-[140px]">
      <svg viewBox="0 0 120 120" className="h-full w-full" aria-label={`${percent} percent exam ready`} role="img">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="#7dd3fc" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - percent / 100)} transform="rotate(-90 60 60)" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <b className="text-[32px] font-extrabold leading-none">{percent}%</b>
        <span className="mt-1 text-[9px] font-semibold tracking-[0.15em] text-[#93c5fd]">EXAM READY</span>
      </div>
    </div>
  );
}

/** The composite, mock by mock, both bars drawn across, and the pace projected to exam day. */
function TrendChart({ points, bar, target, examAt }: { points: { label: string; value: number; at: number }[]; bar: number; target: number; examAt: number | null }) {
  const W = 296;
  const H = 130;
  const left = 32;
  const right = W - 8;
  const top = 14;
  const bottom = H - 24;
  const last = points[points.length - 1];
  // A straight line through the last two, carried to exam day, capped.
  let projected: number | null = null;
  if (points.length >= 2 && examAt && examAt > last.at) {
    const prev = points[points.length - 2];
    const perDay = (last.value - prev.value) / Math.max(1, (last.at - prev.at) / 86400000);
    projected = Math.max(20, Math.min(80, last.value + perDay * ((examAt - last.at) / 86400000)));
  }
  const values = [...points.map((p) => p.value), ...(projected !== null ? [projected] : [])];
  const lo = Math.min(30, ...values) - 2;
  const hi = Math.max(target + 5, ...values) + 2;
  const y = (v: number) => bottom - ((v - lo) / (hi - lo)) * (bottom - top);
  const n = points.length + (projected !== null ? 1 : 0);
  const x = (i: number) => (n === 1 ? (left + right) / 2 : left + (i / (n - 1)) * (right - left));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 h-auto w-full" role="img" aria-label="Composite T-score by mock">
      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#e6e9ef" />
      <line x1={left} y1={y(bar)} x2={right} y2={y(bar)} stroke="#f87171" strokeDasharray="3 3" />
      <text x={0} y={y(bar) + 4} fontSize="10" fill="#b91c1c">T {bar}</text>
      <line x1={left} y1={y(target)} x2={right} y2={y(target)} stroke="#16a34a" strokeDasharray="3 3" />
      <text x={0} y={y(target) + 4} fontSize="10" fill="#15803d">T {target}</text>
      <polyline points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ")} fill="none" stroke="#1d4ed8" strokeWidth="2.5" strokeLinejoin="round" />
      {projected !== null && (
        <>
          <line x1={x(points.length - 1)} y1={y(last.value)} x2={x(points.length)} y2={y(projected)} stroke="#16a34a" strokeWidth="2" strokeDasharray="4 3" />
          <text x={x(points.length)} y={H - 8} fontSize="10" fill="#15803d" textAnchor="middle">exam</text>
        </>
      )}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.value)} r="4" fill={i === points.length - 1 ? "#1d4ed8" : "#fff"} stroke="#1d4ed8" strokeWidth="2" />
          <text x={x(i)} y={H - 8} fontSize="10" fill="#8a94a6" textAnchor="middle">{p.label}</text>
        </g>
      ))}
      <text x={x(points.length - 1)} y={y(last.value) - 8} fontSize="11" fontWeight="700" fill="#0b1220" textAnchor="end">{last.value.toFixed(1)}</text>
    </svg>
  );
}
