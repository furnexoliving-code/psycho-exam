import Link from "next/link";
import { formatDate, formatDateTime, formatDayMonth } from "@/lib/format-time";
import { daysUntil, type ExamSettings } from "@/lib/settings";
import type { Notice } from "@/lib/notices";
import { StudentHeader } from "@/components/StudentHeader";
import { NoticeBoard } from "@/components/dashboard/NoticeBoard";
import { BATTERIES, CATEGORIES } from "@/lib/wt/categories";
import type { PaperSummary } from "@/lib/wt/db";
import type { AttemptAllowance } from "@/lib/wt/attempts";
import type { BatteryProgress } from "@/lib/wt/progress";
import { planFor, readiness, STAGES, type PlanRow } from "@/lib/wt/plan";
import { mockStatus, scoreOutOf30, type LeaderRow, type MockResult, type MockStatus, type MockStep, type MockTest } from "@/lib/wt/mock";

/**
 * The student's dashboard, drawn from what the page loaded. Everything
 * here is arithmetic and markup: no database, so the same screen can be
 * drawn from made-up figures to look at.
 */
export interface DashboardInput {
  profile: { id: string; full_name: string; phone: string; photoUrl: string | null };
  now: number;
  today: string;
  notices: Notice[];
  /** The papers on offer to this student (hidden batteries already left out). */
  papers: PaperSummary[];
  hidden: readonly number[];
  progress: BatteryProgress[];
  mocks: MockTest[];
  mockResults: (MockResult & { mockName: string; mockSlug: string })[];
  inMock: MockStep | null;
  exam: ExamSettings;
  mocksToday: number;
  allowances: Map<string, AttemptAllowance>;
  /** The newest mock's leaderboard, when the page fetched it itself. */
  leaders?: LeaderRow[];
  /** The leaderboard rendered elsewhere, streamed in after the page under a Suspense boundary. */
  leadersSlot?: React.ReactNode;
  /** What the student's packages open; both true for a Kautilya student. */
  access?: { sectional: boolean; full: boolean };
}

const BATTERY_ICON: Record<number, string> = { 1: "🧠", 2: "🧭", 3: "🧊", 4: "👁️", 5: "🔍" };
const BATTERY_SOFT: Record<number, string> = { 1: "bg-violet-50", 2: "bg-sky-50", 3: "bg-cyan-50", 4: "bg-lime-50", 5: "bg-rose-50" };

export function DashboardView({ profile, now, today, notices, papers, hidden, progress, mocks, mockResults, inMock, exam, mocksToday, allowances, leaders = [], leadersSlot, access = { sectional: true, full: true } }: DashboardInput) {
  const stages = { pass: exam.passT, average: STAGES.average, target: exam.targetT };
  const daysLeft = exam.examDate ? daysUntil(exam.examDate, today) : null;

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
  const ready = readiness(
    inPlay.map((p) => p.bestT),
    stages.target,
  );
  const overallStage = inPlay.some((p) => p.bestT === null || p.bestT < stages.pass) ? 1 : inPlay.some((p) => p.bestT! < stages.average) ? 2 : inPlay.some((p) => p.bestT! < stages.target) ? 3 : 4;

  // Mocks: the one in progress, else the next open one.
  const latestByMock = new Map<string, (typeof mockResults)[number]>();
  for (const r of mockResults) if (!latestByMock.has(r.mockId)) latestByMock.set(r.mockId, r);
  const openMocks = mocks.filter((m) => mockStatus(m) === "live" || mockStatus(m) === "scheduled");
  const featured = (inMock && mocks.find((m) => m.id === inMock.mock.id)) || openMocks.find((m) => !latestByMock.has(m.id)) || openMocks[0] || null;
  // The free mock is open from day one, bar or no bar.
  const freeMock = mocks.find((m) => m.isFree && mockStatus(m) === "live") ?? null;
  // Not yet sat and not under way: shown large, as the first thing to do.
  const freeMockPending = freeMock !== null && !access.full && !latestByMock.has(freeMock.id) && !(inMock && inMock.mock.id === freeMock.id);
  const newest = mockResults[0] ?? null;
  const trend = mockResults
    .filter((r) => r.composite !== null)
    .slice()
    .reverse()
    .slice(-8);

  return (
    <div className="flex min-h-screen flex-col bg-[#f3f5f9]">
      <StudentHeader name={profile.full_name || "Candidate"} photoUrl={profile.photoUrl} active="dashboard" />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-5">
        <NoticeBoard notices={notices} />

        {freeMockPending && freeMock && (
          // A new account's first step, on a card of its own: the free mock,
          // before anything that is locked.
          <section className="relative mb-4 overflow-hidden rounded-[18px] border border-[#16a34a]/40 bg-gradient-to-r from-[#f0fdf4] via-white to-[#fefce8] px-5 py-5 shadow-[0_10px_30px_rgba(22,163,74,0.12)] sm:px-6">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#16a34a] via-[#4ade80] to-[#facc15]" aria-hidden="true" />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br from-[#16a34a] to-[#4ade80] text-[28px] shadow-md" aria-hidden="true">
                🎁
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#15803d]">
                  Your free Full Mock is ready{" "}
                  <span className="font-semibold normal-case tracking-normal" lang="hi">
                    · आपका फ्री फुल मॉक तैयार है
                  </span>
                </p>
                <h2 className="mt-0.5 text-[20px] font-extrabold leading-tight text-gray-900">{freeMock.name}</h2>
                <p className="mt-1 text-[13px] text-gray-700">All {freeMock.paperIds.length} tests in the hall&apos;s order, one sitting, then a scorecard with every test&apos;s T-Score. Free for every account, no package needed.</p>
                <p className="text-[12px] text-gray-500" lang="hi">
                  पाँचों टेस्ट हॉल के क्रम में, एक बैठक में; अंत में हर टेस्ट का T-Score। कोई पैकेज नहीं चाहिए।
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                <Link href={`/mock/${freeMock.slug}`} className="rounded-xl bg-[#15803d] px-6 py-3 text-center text-[15px] font-extrabold text-white shadow-lg shadow-green-700/25 hover:bg-[#166534]">
                  Start the free Full Mock ▶
                </Link>
                {!access.sectional && (
                  <Link href="/packages" className="text-center text-[12px] font-semibold text-[#0d2a6b] underline sm:text-right">
                    Practice papers and more mocks: see packages →
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}

        {(!access.sectional || !access.full) && !freeMockPending && (
          <section className="mb-4 flex flex-wrap items-center gap-3 rounded-[14px] border border-amber-300 bg-amber-50 px-5 py-4">
            <span className="text-[24px]" aria-hidden="true">
              🔒
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-amber-900">
                {!access.sectional && !access.full
                  ? freeMock
                    ? "Practice papers and the other Full Mocks come with a package."
                    : "Practice papers and Full Mocks come with a package. Ask at the institute, or see the packages."
                  : !access.sectional
                    ? "Practice papers come with the Sectional package. Your Full Mocks are open."
                    : "Full Mocks come with the Full Mock package. Your practice papers are open."}
              </p>
              <p className="text-[12px] text-amber-800" lang="hi">
                {!access.sectional && !access.full
                  ? freeMock
                    ? "प्रैक्टिस पेपर और बाकी फुल मॉक पैकेज के साथ मिलते हैं।"
                    : "प्रैक्टिस पेपर और फुल मॉक पैकेज के साथ मिलते हैं। संस्थान से पूछें।"
                  : !access.sectional
                    ? "प्रैक्टिस पेपर सेक्शनल पैकेज के साथ मिलते हैं।"
                    : "फुल मॉक टेस्ट फुल मॉक पैकेज के साथ मिलते हैं।"}
              </p>
            </div>
            <Link href="/packages" className="rounded-lg bg-[#0d2a6b] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#0a2158]">
              See packages →
            </Link>
          </section>
        )}

        {/* ------------------------------ Hero ------------------------------ */}
        <section className="relative overflow-hidden rounded-[20px] px-6 py-6 text-white shadow-[0_14px_34px_rgba(13,42,107,0.28)] sm:px-7" style={{ background: "linear-gradient(135deg,#0b1f52 0%,#0d2a6b 45%,#1a44b8 100%)" }}>
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
                    {" "}
                    &nbsp;·&nbsp; EXAM DATE <b className="text-[12px] text-white">{formatDate(exam.examDate).toUpperCase()}</b>
                  </>
                )}
              </div>
              <h1 className="mt-1.5 text-[26px] font-extrabold tracking-tight sm:text-[28px]">Welcome{profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}</h1>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {[
                  { n: 1, label: "Stage 1 · Pass", t: stages.pass },
                  { n: 2, label: "Stage 2 · Average", t: stages.average },
                  { n: 3, label: "Stage 3 · Target", t: stages.target },
                ].map((s, i) => (
                  <span key={s.n} className="flex items-center gap-2">
                    {i > 0 && (
                      <span className="text-[16px] text-[#93c5fd]" aria-hidden="true">
                        ›
                      </span>
                    )}
                    <span
                      className={`rounded-full border px-3 py-1.5 text-[11.5px] ${
                        overallStage > s.n ? "border-[#4ade80] text-[#bbf7d0]" : overallStage === s.n ? "border-white bg-white font-semibold text-[#0d2a6b]" : "border-white/20 bg-white/[0.08] text-[#c9d8ff]"
                      }`}
                    >
                      {overallStage > s.n ? "✓ " : ""}
                      {s.label} <b className={overallStage === s.n ? "text-[#0d2a6b]" : "text-white"}>T-Score: {s.t}</b>
                    </span>
                  </span>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <HeroStat big={daysLeft === null ? "—" : daysLeft < 0 ? "0" : String(daysLeft)} label={daysLeft !== null && daysLeft === 0 ? "exam day is today" : "days to the exam"} />
                <HeroStat big={String(passed)} suffix={`/${inPlay.length}`} label={`tests passed · T-Score ${stages.pass}+`} />
                <HeroStat big={String(atTarget)} suffix={`/${inPlay.length}`} label={`tests at target · T-Score ${stages.target}+`} />
                <HeroStat big={newest && scoreOutOf30(newest.tests) !== null ? scoreOutOf30(newest.tests)!.toFixed(1) : "—"} suffix={newest ? "/30" : ""} label={newest ? `last Full Mock · ${newest.mockName}` : "no Full Mock yet"} />
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
                {featured &&
                  !inMock &&
                  (plan.mocksUnlocked ? (
                    <Link href={`/mock/${featured.slug}`} className="rounded-[10px] border border-white/35 bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-white/20">
                      {mockStatus(featured) === "live" ? `Start ${featured.name}` : `${featured.name} · opens ${featured.opensAt ? formatDateTime(featured.opensAt) : "soon"}`}
                    </Link>
                  ) : freeMock ? (
                    <Link href={`/mock/${freeMock.slug}`} className="rounded-[10px] border border-white/35 bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-white/20">
                      🎁 Start the free Full Mock
                    </Link>
                  ) : (
                    <span className="rounded-[10px] border border-white/35 bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white/90">🔒 Full Mock unlocks when every battery is {stages.pass}+</span>
                  ))}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center lg:border-l lg:border-white/15 lg:pl-5">
              <Gauge percent={ready} />
              <p className="mt-2 text-center text-[11px] leading-relaxed text-[#c9d8ff]">
                How ready you are: all 5 tests measured against <b className="text-white">T-Score: {stages.target}</b>.
              </p>
            </div>
          </div>
        </section>

        {/* ---------------------------- Today's plan ---------------------------- */}
        <section className="mt-4 rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm sm:p-5" id="plan">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[14px] font-bold text-gray-900">
              Today&apos;s plan{" "}
              <span className="font-normal text-gray-500" lang="hi">
                / आज का प्लान
              </span>
              <span className="ml-1 font-normal text-gray-500">· {formatDate(now)}</span>
            </h2>
            <div className="text-[12px] text-gray-600">
              <b className="text-gray-900">
                {plan.sectionalDone} of {plan.sectionalTarget}
              </b>{" "}
              practice tests done today
              {" · "}Full Mock <b className="text-gray-900">{plan.mocksUnlocked ? `${mocksToday} of ${plan.mocksTarget}` : "locked"}</b>
            </div>
          </div>
          <p className="mt-1.5 text-[12px] text-gray-600">
            Do the rows top to bottom: the weakest test comes first. Each row shows your best T-Score, the next goal to reach, how many papers to do today, and the paper to open.
            <span className="block text-[11px] text-gray-500" lang="hi">
              ऊपर से नीचे करें: सबसे कमज़ोर टेस्ट सबसे ऊपर है। हर पंक्ति में आपका best T-Score, अगला लक्ष्य, आज कितने पेपर देने हैं, और कौन सा पेपर खोलना है।
            </span>
          </p>
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
                  <th className="px-2 py-1.5">Test</th>
                  <th className="whitespace-nowrap px-2 py-1.5">Best T-Score</th>
                  <th className="whitespace-nowrap px-2 py-1.5">Next goal</th>
                  <th className="whitespace-nowrap px-2 py-1.5">Do today</th>
                  <th className="whitespace-nowrap px-2 py-1.5">Done today</th>
                  <th className="whitespace-nowrap px-2 py-1.5">Open this paper</th>
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
                      <td className={`whitespace-nowrap px-2 py-2.5 font-bold text-gray-900 ${hot ? "border-l-[3px] border-[#1d4ed8]" : ""}`}>
                        Test {row.battery} · {row.title.replace(" Test", "")}
                        {hot && <span className="mt-1 block w-fit rounded bg-[#1d4ed8] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">Do this first</span>}
                      </td>
                      <td className={`px-2 py-2.5 font-bold tabular-nums ${tone}`}>{row.bestT === null ? "—" : row.bestT.toFixed(0)}</td>
                      <td className="whitespace-nowrap px-2 py-2.5">
                        <StageChip row={row} stages={stages} />
                      </td>
                      <td className="px-2 py-2.5 whitespace-nowrap">
                        {row.keepSharp ? (
                          row.due ? (
                            <b>1 paper</b>
                          ) : (
                            <span className="text-gray-500">1 every 3 days</span>
                          )
                        ) : (
                          <>
                            <b>{row.target}</b> paper{row.target === 1 ? "" : "s"}
                          </>
                        )}
                      </td>
                      <td className="px-2 py-2.5 whitespace-nowrap">
                        <span className="mr-1.5 inline-block h-1.5 w-[70px] overflow-hidden rounded bg-[#eef1f6] align-middle">
                          <span className={`block h-full rounded ${row.keepSharp && !row.due ? "bg-green-600" : "bg-[#1d4ed8]"}`} style={{ width: `${pct}%` }} />
                        </span>
                        <span className="text-[11px] text-gray-600">{row.keepSharp && !row.due ? "✓" : `${row.done} / ${row.keepSharp ? 1 : row.target}`}</span>
                      </td>
                      <td className="px-2 py-2.5 whitespace-nowrap">
                        {next ? (
                          <Link href={`/test/${next.paper.slug}`} className="font-bold text-[#1d4ed8] hover:underline">
                            {row.keepSharp && !row.due ? "Revise" : "Start"} · {next.paper.displayName}
                            {next.allowance.max !== null && (
                              <span className="font-normal text-gray-500">
                                {" "}
                                ({next.allowance.remaining} of {next.allowance.max} attempts left)
                              </span>
                            )}
                            {" →"}
                          </Link>
                        ) : (
                          <span className="text-gray-400">
                            {access.sectional ? (
                              "No paper with attempts left"
                            ) : (
                              <Link href="/packages#sectional" className="font-semibold text-[#1d4ed8] hover:underline">
                                In the Sectional package →
                              </Link>
                            )}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t border-gray-100 bg-[#fafafa]">
                  <td className="px-2 py-2.5 font-bold text-gray-900">Full Mock Tests</td>
                  <td className="whitespace-nowrap px-2 py-2.5" colSpan={2}>
                    {plan.mocksUnlocked ? (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">✓ Open · every test at {stages.pass}+</span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                        🔒 Locked · {passed} of {inPlay.length} tests at {stages.pass}+
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2.5 whitespace-nowrap">
                    {plan.mocksUnlocked ? (
                      <>
                        <b>2</b> mocks
                      </>
                    ) : (
                      <span className="text-gray-500">2 a day, once open</span>
                    )}
                  </td>
                  <td className="px-2 py-2.5 whitespace-nowrap">
                    <span className="mr-1.5 inline-block h-1.5 w-[70px] overflow-hidden rounded bg-[#eef1f6] align-middle">
                      <span className="block h-full rounded bg-[#1d4ed8]" style={{ width: `${plan.mocksUnlocked ? Math.min(100, (mocksToday / 2) * 100) : 0}%` }} />
                    </span>
                    <span className="text-[11px] text-gray-600">{mocksToday} / 2</span>
                  </td>
                  <td className="px-2 py-2.5 whitespace-nowrap">
                    {plan.mocksUnlocked && featured ? (
                      <Link href={`/mock/${featured.slug}`} className="font-bold text-[#1d4ed8] hover:underline">
                        Open · {featured.name} →
                      </Link>
                    ) : plan.mocksUnlocked ? (
                      <span className="text-gray-400">No Full Mock open right now</span>
                    ) : (
                      <span className="text-gray-500">
                        Reach T-Score {stages.pass} in{" "}
                        {plan.rows
                          .filter((r) => r.stage === 1)
                          .map((r) => r.title.replace(" Test", ""))
                          .join(", ")}{" "}
                        to unlock
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-gray-500">
            T-Score colours: <span className="font-bold text-red-700">red</span> below {stages.pass} · <span className="font-bold text-amber-700">amber</span> {stages.pass}–{stages.target - 1}, passed · <span className="font-bold text-green-700">green</span>{" "}
            {stages.target}+, target reached.
            <span className="ml-1" lang="hi">
              लाल = {stages.pass} से कम · पीला = पास · हरा = लक्ष्य पूरा
            </span>
          </p>
        </section>

        {/* --------------------------- Battery tiles --------------------------- */}
        <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 px-1">
          <h2 className="text-[14px] font-bold text-gray-900">
            Your 5 tests{" "}
            <span className="font-normal text-gray-500" lang="hi">
              / आपके 5 टेस्ट
            </span>
          </h2>
          <p className="text-[11px] text-gray-500">
            The real exam has these 5 tests. Pass needs T-Score {stages.pass} in each; aim for {stages.target}. Bar: {stages.pass} pass · {stages.average} average · {stages.target} target. Lines below: your best score each day;{" "}
            <span className="font-bold text-red-500">|</span> = {stages.pass}, <span className="font-bold text-green-600">|</span> = {stages.target}.
          </p>
        </div>
        <section className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {visibleBatteries.map((battery) => {
            const p = progress.find((x) => x.battery === battery.id) as BatteryProgress;
            const t = p?.bestT ?? null;
            const hot = focus?.battery === battery.id;
            return (
              <div key={battery.id} className={`relative rounded-[14px] border bg-white p-3.5 shadow-sm ${hot ? "border-2 border-[#1d4ed8] shadow-[0_6px_18px_rgba(29,78,216,0.18)]" : "border-gray-200"}`}>
                {hot && <span className="absolute -top-2.5 right-3 rounded-full bg-[#1d4ed8] px-2 py-0.5 text-[9px] font-extrabold text-white">FOCUS TODAY</span>}
                <div className="flex items-center gap-2">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-[9px] text-[15px] ${BATTERY_SOFT[battery.id]}`} aria-hidden="true">
                    {BATTERY_ICON[battery.id]}
                  </span>
                  <span>
                    <span className="block text-[10px] text-gray-500">Test {battery.id}</span>
                    <span className="block text-[12px] font-bold leading-tight text-gray-900">{battery.title.replace(" Test", "")}</span>
                  </span>
                </div>
                <div className="mt-2 text-[26px] font-extrabold leading-none text-gray-900">
                  {t === null ? "—" : t.toFixed(0)} <span className="text-[10px] font-semibold text-gray-500">your best T-Score</span>
                </div>
                <div className="mt-2">
                  <StageChip row={{ ...stageRow(t, stages) }} stages={stages} />
                </div>
                <StageBar t={t} stages={stages} />

                <div className="mt-2.5 border-t border-dashed border-gray-200 pt-2">
                  <div className="flex justify-between text-[10px] font-semibold text-gray-500">
                    <span>Last 3 days</span>
                    <span>T-Score</span>
                  </div>
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
                      return p?.attempts ? `${p.attempts} attempt${p.attempts === 1 ? "" : "s"} on ${p.papersSat} paper${p.papersSat === 1 ? "" : "s"}` : "Not started yet · do one paper today";
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_330px]">
          <div className="min-w-0">
            {/* ------------------ Full Mocks and Practice, in brief ------------------ */}
            <div className="grid gap-4 sm:grid-cols-2">
              <section className="flex flex-col rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm sm:p-5" id="mocks">
                <h2 className="flex items-center text-[14px] font-bold text-gray-900">
                  Full Mock Tests{" "}
                  <span className="ml-1 font-normal text-gray-500" lang="hi">
                    / पूर्ण मॉक
                  </span>
                  <Link href="/mocks" className="ml-auto text-[11px] font-semibold text-[#1d4ed8] hover:underline">
                    All mocks →
                  </Link>
                </h2>
                <div className="mt-3 grid grid-cols-3 gap-2 border-b border-gray-100 pb-3 text-center">
                  <Mini big={String(mocks.length)} label="available" />
                  <Mini big={String(latestByMock.size)} label="completed" />
                  <Mini big={newest ? (scoreOutOf30(newest.tests) ?? 0).toFixed(1) : "—"} label="last / 30" tone={newest ? (newest.qualified ? "green" : "red") : "gray"} />
                </div>
                <div className="mt-3 flex-1 text-[12px]">
                  {inMock ? (
                    <p className="text-gray-700">
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">⏵ In progress</span> <b>{inMock.mock.name}</b> · Test {inMock.step + 1} of {inMock.papers.length}
                    </p>
                  ) : !plan.mocksUnlocked && freeMock ? (
                    <p className="text-gray-700">
                      🎁 <b>{freeMock.name}</b> is free and open now.{" "}
                      <Link href={`/mock/${freeMock.slug}`} className="font-semibold text-[#1d4ed8] hover:underline">
                        Start →
                      </Link>{" "}
                      The others unlock at T-Score: {stages.pass}+ in every battery.
                    </p>
                  ) : !plan.mocksUnlocked ? (
                    <p className="text-gray-600">
                      🔒 Unlocks when every battery is at T-Score: {stages.pass}+.{" "}
                      {inPlay.filter((p) => p.bestT === null || p.bestT < stages.pass).length === 1 ? "1 battery" : `${inPlay.filter((p) => p.bestT === null || p.bestT < stages.pass).length} batteries`} to go.
                    </p>
                  ) : featured ? (
                    <p className="text-gray-700">
                      <b>{featured.name}</b> · {mockWindow(featured, mockStatus(featured))}
                    </p>
                  ) : (
                    <p className="text-gray-500">Full Mocks appear here when the institute opens them.</p>
                  )}
                </div>
                <Link
                  href={inMock ? `/mock/${inMock.mock.slug}` : plan.mocksUnlocked && featured && mockStatus(featured) === "live" ? `/mock/${featured.slug}` : "/mocks"}
                  className={`mt-3 block rounded-lg px-3 py-2 text-center text-[12px] font-bold ${inMock || (plan.mocksUnlocked && featured && mockStatus(featured) === "live") ? "bg-[#1d4ed8] text-white hover:bg-[#1e40af]" : "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50"}`}
                >
                  {inMock ? "Continue the mock →" : plan.mocksUnlocked && featured && mockStatus(featured) === "live" ? `Start ${featured.name} →` : "See all Full Mocks →"}
                </Link>
              </section>

              <section className="flex flex-col rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm sm:p-5" id="practice">
                <h2 className="flex items-center text-[14px] font-bold text-gray-900">
                  Practice Tests{" "}
                  <span className="ml-1 font-normal text-gray-500" lang="hi">
                    / अभ्यास
                  </span>
                  <Link href="/practice" className="ml-auto text-[11px] font-semibold text-[#1d4ed8] hover:underline">
                    All practice →
                  </Link>
                </h2>
                <div className="mt-3 grid grid-cols-3 gap-2 border-b border-gray-100 pb-3 text-center">
                  <Mini big={String(papers.length)} label="papers" />
                  <Mini big={String(inPlay.reduce((n, p) => n + p.papersSat, 0))} label="attempted" />
                  <Mini big={String(inPlay.reduce((n, p) => n + p.attempts, 0))} label="attempts" />
                </div>
                <ul className="mt-3 flex-1 space-y-1 text-[12px]">
                  {visibleBatteries.map((b) => {
                    const n = papers.filter((p) => CATEGORIES.find((c) => c.id === p.category)?.battery === b.id).length;
                    const prog = progress.find((p) => p.battery === b.id);
                    return (
                      <li key={b.id} className="flex items-center gap-2">
                        <Link href={`/practice#battery-${b.id}`} className="min-w-0 flex-1 truncate text-gray-800 hover:underline">
                          Test {b.id} · {b.title.replace(" Test", "")}
                        </Link>
                        <span className="tabular-nums text-gray-500">
                          {prog?.papersSat ?? 0}/{n}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <Link href={focusNext ? `/test/${focusNext.paper.slug}` : "/practice"} className="mt-3 block rounded-lg bg-[#1d4ed8] px-3 py-2 text-center text-[12px] font-bold text-white hover:bg-[#1e40af]">
                  {focusNext ? `Start ${focusNext.paper.displayName} →` : "Open practice →"}
                </Link>
              </section>
            </div>
          </div>

          {/* ------------------------------ Side column ------------------------------ */}
          <aside className="space-y-4">
            <section className="rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-[14px] font-bold text-gray-900">
                My progress <span className="font-normal text-gray-500">· Full Mock average T-Score</span>
              </h2>
              {trend.length === 0 ? (
                <p className="mt-2 text-[12px] text-gray-500">
                  The graph appears after your first Full Mock. Red line: pass (T-Score: {stages.pass}). Green line: target (T-Score: {stages.target}).
                </p>
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
                Road to T-Score: {stages.target}{" "}
                <span className="font-normal text-gray-500" lang="hi">
                  / लक्ष्य
                </span>
              </h2>
              <ul className="mt-1 divide-y divide-gray-100">
                {inPlay
                  .slice()
                  .sort((a, b) => (a.bestT ?? -1) - (b.bestT ?? -1))
                  .map((p) => {
                    const gap = p.bestT === null ? null : Math.max(0, stages.target - p.bestT);
                    const pct = p.bestT === null ? 0 : Math.max(4, Math.min(100, ((p.bestT - 20) / (stages.target - 20)) * 100));
                    return (
                      <li key={p.battery} className="py-2 text-[12px]">
                        <div className="flex items-center gap-2">
                          <Link href={`#battery-${p.battery}`} className="flex-1 truncate font-semibold text-gray-900 hover:underline">
                            Test {p.battery} · {p.title.replace(" Test", "")}
                          </Link>
                          <span className={`shrink-0 font-bold tabular-nums ${gap === 0 ? "text-green-700" : p.bestT !== null && p.bestT < stages.pass ? "text-red-700" : gap === null ? "text-gray-400" : "text-amber-700"}`}>
                            {p.bestT === null || gap === null ? "not attempted" : gap === 0 ? "✓ done" : `+${gap.toFixed(0)} to go`}
                          </span>
                        </div>
                        <div className="mt-1 h-1 rounded bg-[#eef1f6]">
                          <div className={`h-full rounded ${gap === 0 ? "bg-green-600" : "bg-[#1d4ed8]"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </section>

            {leadersSlot !== undefined ? leadersSlot : newest && leaders.length > 0 && <LeaderBoard leaders={leaders} mockName={newest.mockName} mockSlug={newest.mockSlug} myId={profile.id} />}
          </aside>
        </div>
      </main>
    </div>
  );
}

/** The newest mock's top five, with the student's own row marked. */
export function LeaderBoard({ leaders, mockName, mockSlug, myId }: { leaders: LeaderRow[]; mockName: string; mockSlug: string; myId: string }) {
  return (
    <section className="rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-[14px] font-bold text-gray-900">
        Leaderboard <span className="font-normal text-gray-500">· {mockName}</span>
        <Link href={`/mock/${mockSlug}/result`} className="float-right text-[11px] font-semibold text-[#1d4ed8] hover:underline">
          Full →
        </Link>
      </h2>
      <ol className="mt-2 divide-y divide-gray-100">
        {leaders.map((row) => (
          <li key={row.userId} className={`flex items-center gap-2 py-1.5 text-[12px] ${row.userId === myId ? "-mx-2 rounded-lg bg-blue-50 px-2 font-bold" : ""}`}>
            <span className="w-5 text-gray-500">{row.rank}</span>
            <span className="flex-1 truncate text-gray-900">
              {row.name}
              {row.userId === myId ? " (you)" : ""}
            </span>
            <span className="whitespace-nowrap font-bold tabular-nums">{(((row.composite * 5) / 400) * 30).toFixed(1)} / 30</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function mockWindow(mock: { opensAt: string | null; closesAt: string | null }, status: MockStatus): string {
  if (status === "scheduled" && mock.opensAt) return `Opens ${formatDateTime(mock.opensAt)}`;
  if (status === "live" && mock.closesAt) return `Till ${formatDateTime(mock.closesAt)}`;
  if (status === "closed") return "Over";
  return "Open now";
}

type Stages = { pass: number; average: number; target: number };

function stageRow(t: number | null, s: Stages): Pick<PlanRow, "bestT" | "stage" | "next" | "keepSharp"> {
  if (t === null || t < s.pass) return { bestT: t, stage: 1, next: s.pass, keepSharp: false };
  if (t < s.average) return { bestT: t, stage: 2, next: s.average, keepSharp: false };
  if (t < s.target) return { bestT: t, stage: 3, next: s.target, keepSharp: false };
  return { bestT: t, stage: 4, next: null, keepSharp: true };
}

function StageChip({ row, stages }: { row: Pick<PlanRow, "bestT" | "stage" | "next" | "keepSharp">; stages: Stages }) {
  if (row.bestT === null) return <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">Not attempted yet · first goal T-Score {stages.pass}</span>;
  if (row.keepSharp) return <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">✓ Target reached · T-Score {stages.target}+</span>;
  const cls = row.stage === 1 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700";
  const gap = Math.max(1, Math.ceil((row.next as number) - row.bestT));
  const goal = row.stage === 1 ? "pass" : row.stage === 2 ? "average" : "target";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>
      +{gap} more → T-Score {row.next} ({goal})
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
      <div className="mt-0.5 flex justify-between text-[9px] text-gray-500">
        <span>{stages.pass} pass</span>
        <span>{stages.average} avg</span>
        <span>{stages.target} target</span>
      </div>
    </div>
  );
}

function HeroStat({ big, suffix = "", label }: { big: string; suffix?: string; label: string }) {
  return (
    <div className="rounded-[12px] border border-white/15 bg-white/[0.08] px-3.5 py-3">
      <div className="text-[24px] font-extrabold leading-none">
        {big}
        {suffix && <span className="text-[12px] font-bold text-[#93c5fd]">{suffix}</span>}
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
      <text x={0} y={y(bar) + 4} fontSize="10" fill="#b91c1c">
        T {bar}
      </text>
      <line x1={left} y1={y(target)} x2={right} y2={y(target)} stroke="#16a34a" strokeDasharray="3 3" />
      <text x={0} y={y(target) + 4} fontSize="10" fill="#15803d">
        T {target}
      </text>
      <polyline points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ")} fill="none" stroke="#1d4ed8" strokeWidth="2.5" strokeLinejoin="round" />
      {projected !== null && (
        <>
          <line x1={x(points.length - 1)} y1={y(last.value)} x2={x(points.length)} y2={y(projected)} stroke="#16a34a" strokeWidth="2" strokeDasharray="4 3" />
          <text x={x(points.length)} y={H - 8} fontSize="10" fill="#15803d" textAnchor="middle">
            exam
          </text>
        </>
      )}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.value)} r="4" fill={i === points.length - 1 ? "#1d4ed8" : "#fff"} stroke="#1d4ed8" strokeWidth="2" />
          <text x={x(i)} y={H - 8} fontSize="10" fill="#8a94a6" textAnchor="middle">
            {p.label}
          </text>
        </g>
      ))}
      <text x={x(points.length - 1)} y={y(last.value) - 8} fontSize="11" fontWeight="700" fill="#0b1220" textAnchor="end">
        {last.value.toFixed(1)}
      </text>
    </svg>
  );
}

function Mini({ big, label, tone = "gray" }: { big: string; label: string; tone?: "gray" | "green" | "red" }) {
  const color = tone === "green" ? "text-green-700" : tone === "red" ? "text-red-700" : "text-gray-900";
  return (
    <div className="rounded-[10px] bg-[#f8fafc] px-2 py-1.5">
      <div className={`text-[17px] font-extrabold tabular-nums ${color}`}>{big}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</div>
    </div>
  );
}
