import { indianDay } from "@/lib/format-time";
import { cohortFor } from "./cohort";
import { outOf30, tScore, type Cohort } from "./tscore";
import { BATTERIES, CATEGORIES } from "./categories";
import { batteryOf } from "./series";

/**
 * The batch in figures: what Admin › Analytics shows, and how it is worked
 * out. Two paths produce the same figures: the database's admin_analytics()
 * (supabase/admin-analytics.sql), one call over every attempt where the
 * rows are, and aggregateRows() here over rows read through the API, for a
 * database on which the function has not been created yet. Both hand back
 * Aggregates, the figures before rounding and ordering; assemble() turns
 * them into the page. Nothing in this file touches the network, so the two
 * paths can be checked against each other.
 */

export const DAYS = 14;
export const QUIET_AFTER_DAYS = 7;
/** The "gone quiet" table lists this many; the total is counted separately. */
export const QUIET_LIMIT = 30;

export interface DayActivity {
  /** "2026-10-09", an Indian day. */
  day: string;
  attempts: number;
  /** Distinct students who sat something that day. */
  students: number;
}

export interface PaperDifficulty {
  id: string;
  slug: string;
  name: string;
  battery: number;
  published: boolean;
  students: number;
  attempts: number;
  /** Mean score over every attempt, as a percentage of the paper. */
  meanPct: number | null;
  /** The spread of those scores, in percentage points. */
  sdPct: number | null;
  /** Of the students who sat it, the share whose best is at the pass mark; null until a T-score exists. */
  passRate: number | null;
}

export interface BatteryReadiness {
  battery: number;
  title: string;
  /** Students who sat at least one paper of the battery. */
  sat: number;
  /** Of them, how many have a best T-score at the pass mark, and at the target. */
  passed: number;
  target: number;
  meanBestT: number | null;
  hardest: { slug: string; name: string; meanPct: number } | null;
}

export interface QuietStudent {
  id: string;
  name: string;
  phone: string;
  lastAt: string;
  attempts: number;
  bestT: number | null;
}

export interface MockSummary {
  slug: string;
  name: string;
  sat: number;
  students: number;
  qualified: number;
  meanOut30: number | null;
}

export interface Analytics {
  asOf: string;
  passT: number;
  targetT: number;
  days: DayActivity[];
  totals: {
    students: number;
    active: number;
    attempts: number;
    attempts14: number;
    students14: number;
    satAny: number;
    /** Students at the pass mark in every battery. */
    ready: number;
    /** Switched-on students who have never sat a paper. */
    neverSat: number;
    /** Switched-on students who have sat papers, none in the last week. */
    quiet7: number;
  };
  batteries: BatteryReadiness[];
  /** Hardest first. */
  papers: PaperDifficulty[];
  quiet: QuietStudent[];
  mocks: {
    finished: number;
    students: number;
    qualified: number;
    byMock: MockSummary[];
  };
}

/**
 * The figures before rounding and ordering: what admin_analytics() hands
 * back as JSON, and what aggregateRows() works out from the rows. Means
 * are left unrounded and lists unordered so that the one place that
 * rounds and orders, assemble(), is the same for both.
 */
export interface Aggregates {
  /** The Indian day the figures were cut at, "2026-10-17": the chart's last bar. Absent from the function's first version. */
  today?: string;
  totals: Analytics["totals"];
  /** Only the days with an attempt; the chart fills in the rest. */
  days: DayActivity[];
  papers: {
    id: string;
    slug: string;
    name: string;
    battery: number;
    published: boolean;
    students: number;
    attempts: number;
    meanPct: number | null;
    sdPct: number | null;
    /** Students of the paper with a best T-score, and of them, those at the pass mark. */
    measured: number;
    passed: number;
  }[];
  batteries: {
    battery: number;
    sat: number;
    passed: number;
    target: number;
    meanBestT: number | null;
  }[];
  /** The first QUIET_LIMIT, most recently stopped first. */
  quiet: {
    id: string;
    fullName: string | null;
    phone: string | null;
    lastAt: string;
    attempts: number;
    bestT: number | null;
  }[];
  mocks: {
    finished: number;
    students: number;
    qualified: number;
    byMock: MockSummary[];
  };
}

/** The rows the figures are worked out from when the database cannot do it itself. */
export interface PaperRow {
  id: string;
  slug: string;
  display_name: string;
  category: string;
  is_published: boolean;
  stats_min_attempts: number | null;
  reference_mean: number | null;
  reference_sd: number | null;
}
export interface AttemptRow {
  user_id: string | null;
  paper_id: string;
  marks: number;
  total: number;
  submitted_at: string;
}
export interface StudentRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  is_active: boolean;
}
export interface MockRow {
  mock_id: string;
  user_id: string | null;
  tests: { tScore: number | null }[] | null;
  qualified: boolean | null;
}
export interface MockTestRow {
  id: string;
  slug: string;
  name: string;
}
export interface AnalyticsRows {
  papers: PaperRow[];
  /** In the order they were submitted. */
  attempts: AttemptRow[];
  students: StudentRow[];
  mocks: MockRow[];
  /** In the panel's order. */
  mockTests: MockTestRow[];
}

/** Which test each kind of paper belongs to, for admin_analytics(). */
export function batteryByCategory(): Record<string, number> {
  return Object.fromEntries(CATEGORIES.map((c) => [c.id, c.battery]));
}

function mean(xs: number[]): number | null {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}
function sd(xs: number[]): number | null {
  const m = mean(xs);
  if (m === null) return null;
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / xs.length);
}
const round1 = (x: number | null) => (x === null ? null : Number(x.toFixed(1)));

/**
 * The figures from the rows, in one pass over the attempts: the cohorts
 * (each student's latest attempt per paper, as the database's own cohort
 * function counts them), each student's best marks per paper and so their
 * best T-score per battery, the day-by-day activity, and who has gone
 * quiet. What admin_analytics() does in SQL, done here.
 */
export function aggregateRows(rows: AnalyticsRows, passT: number, targetT: number, now: number): Aggregates {
  const papers = new Map(rows.papers.map((p) => [p.id, p]));
  const { attempts, students } = rows;

  // Each student's latest attempt per paper is the cohort; their best is the score that counts.
  const latest = new Map<string, AttemptRow>();
  const best = new Map<string, AttemptRow>();
  const perPaper = new Map<string, { students: Set<string>; attempts: number; pcts: number[] }>();
  const perDay = new Map<string, { attempts: number; students: Set<string> }>();
  const lastAt = new Map<string, string>();
  const attemptCount = new Map<string, number>();
  // The chart's first day, so the fortnight's totals and its bars agree.
  const firstDay = indianDay(now - (DAYS - 1) * 86400000);
  const since7 = now - QUIET_AFTER_DAYS * 86400000;
  let attempts14 = 0;
  const students14 = new Set<string>();
  attempts.forEach((a, i) => {
    const who = a.user_id ?? `anon-${i}`;
    latest.set(`${a.paper_id}:${who}`, a);
    const bKey = `${who}:${a.paper_id}:${a.total}`;
    const b = best.get(bKey);
    if (!b || a.marks > b.marks) best.set(bKey, a);
    const pp = perPaper.get(a.paper_id) ?? {
      students: new Set<string>(),
      attempts: 0,
      pcts: [],
    };
    pp.students.add(who);
    pp.attempts += 1;
    if (a.total > 0) pp.pcts.push((a.marks / a.total) * 100);
    perPaper.set(a.paper_id, pp);
    const day = indianDay(a.submitted_at);
    if (day >= firstDay) {
      attempts14 += 1;
      if (a.user_id) students14.add(a.user_id);
      const d = perDay.get(day) ?? { attempts: 0, students: new Set<string>() };
      d.attempts += 1;
      if (a.user_id) d.students.add(a.user_id);
      perDay.set(day, d);
    }
    if (a.user_id) {
      if (!lastAt.has(a.user_id) || a.submitted_at > (lastAt.get(a.user_id) as string)) lastAt.set(a.user_id, a.submitted_at);
      attemptCount.set(a.user_id, (attemptCount.get(a.user_id) ?? 0) + 1);
    }
  });

  const cohortMarks = new Map<string, number[]>();
  for (const a of latest.values()) {
    const key = `${a.paper_id}:${a.total}`;
    const marks = cohortMarks.get(key);
    if (marks) marks.push(a.marks);
    else cohortMarks.set(key, [a.marks]);
  }
  const cohorts = new Map<string, Cohort | null>();
  for (const [key, marks] of cohortMarks) {
    const paper = papers.get(key.split(":")[0]);
    cohorts.set(key, paper ? cohortFor(marks, paper) : null);
  }

  // Best T-score per student per paper, and per battery.
  const bestTByStudentPaper = new Map<string, Map<string, number>>();
  const bestTByStudentBattery = new Map<string, Map<number, number>>();
  for (const a of best.values()) {
    if (!a.user_id) continue;
    const paper = papers.get(a.paper_id);
    if (!paper) continue;
    const t = tScore(a.marks, cohorts.get(`${a.paper_id}:${a.total}`) ?? null);
    if (!t) continue;
    const byPaper = bestTByStudentPaper.get(a.user_id) ?? new Map<string, number>();
    byPaper.set(a.paper_id, Math.max(byPaper.get(a.paper_id) ?? -Infinity, t.value));
    bestTByStudentPaper.set(a.user_id, byPaper);
    const battery = batteryOf(paper.category);
    const byBattery = bestTByStudentBattery.get(a.user_id) ?? new Map<number, number>();
    byBattery.set(battery, Math.max(byBattery.get(battery) ?? -Infinity, t.value));
    bestTByStudentBattery.set(a.user_id, byBattery);
  }

  const paperRows: Aggregates["papers"] = [];
  for (const [id, pp] of perPaper) {
    const paper = papers.get(id);
    if (!paper) continue;
    let measured = 0;
    let passed = 0;
    for (const who of pp.students) {
      const t = bestTByStudentPaper.get(who)?.get(id);
      if (t === undefined) continue;
      measured += 1;
      if (t >= passT) passed += 1;
    }
    paperRows.push({
      id,
      slug: paper.slug,
      name: paper.display_name,
      battery: batteryOf(paper.category),
      published: paper.is_published,
      students: pp.students.size,
      attempts: pp.attempts,
      meanPct: mean(pp.pcts),
      sdPct: sd(pp.pcts),
      measured,
      passed,
    });
  }

  const satBattery = new Map<number, Set<string>>();
  for (const a of attempts) {
    const paper = a.user_id ? papers.get(a.paper_id) : undefined;
    if (!paper) continue;
    const battery = batteryOf(paper.category);
    const set = satBattery.get(battery) ?? new Set<string>();
    set.add(a.user_id as string);
    satBattery.set(battery, set);
  }
  const batteries: Aggregates["batteries"] = BATTERIES.map((b) => {
    const sat = satBattery.get(b.id) ?? new Set<string>();
    const ts: number[] = [];
    for (const who of sat) {
      const t = bestTByStudentBattery.get(who)?.get(b.id);
      if (t !== undefined) ts.push(t);
    }
    return {
      battery: b.id,
      sat: sat.size,
      passed: ts.filter((t) => t >= passT).length,
      target: ts.filter((t) => t >= targetT).length,
      meanBestT: mean(ts),
    };
  });

  const active = students.filter((s) => s.is_active);
  let ready = 0;
  for (const byBattery of bestTByStudentBattery.values()) {
    if (BATTERIES.every((b) => (byBattery.get(b.id) ?? -Infinity) >= passT)) ready += 1;
  }
  const quietAll = active.filter((s) => lastAt.has(s.id) && Date.parse(lastAt.get(s.id) as string) < since7);
  const quiet: Aggregates["quiet"] = quietAll
    .map((s) => {
      const ts = [...(bestTByStudentBattery.get(s.id)?.values() ?? [])];
      return {
        id: s.id,
        fullName: s.full_name,
        phone: s.phone,
        lastAt: lastAt.get(s.id) as string,
        attempts: attemptCount.get(s.id) ?? 0,
        bestT: ts.length ? Math.max(...ts) : null,
      };
    })
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt))
    .slice(0, QUIET_LIMIT);

  const days: DayActivity[] = [...perDay.entries()].map(([day, d]) => ({ day, attempts: d.attempts, students: d.students.size }));

  const mockMeta = new Map(rows.mockTests.map((m) => [m.id, m]));
  const byMock = new Map<string, { sat: number; students: Set<string>; qualified: number; outs: number[] }>();
  const mockStudents = new Set<string>();
  let mockQualified = 0;
  for (const r of rows.mocks) {
    const m = byMock.get(r.mock_id) ?? {
      sat: 0,
      students: new Set<string>(),
      qualified: 0,
      outs: [],
    };
    m.sat += 1;
    if (r.user_id) {
      m.students.add(r.user_id);
      mockStudents.add(r.user_id);
    }
    if (r.qualified) {
      m.qualified += 1;
      mockQualified += 1;
    }
    // Unrounded here; the mean is rounded once, in assemble().
    const out = outOf30(Array.isArray(r.tests) ? r.tests : []);
    if (out !== null) m.outs.push(out);
    byMock.set(r.mock_id, m);
  }
  const mockOrder = rows.mockTests.map((m) => m.id);
  const byMockRows: MockSummary[] = [...byMock.entries()]
    .sort((a, b) => mockOrder.indexOf(a[0]) - mockOrder.indexOf(b[0]))
    .map(([id, m]) => ({
      slug: mockMeta.get(id)?.slug ?? "",
      name: mockMeta.get(id)?.name ?? "A deleted mock",
      sat: m.sat,
      students: m.students.size,
      qualified: m.qualified,
      meanOut30: mean(m.outs),
    }));

  return {
    today: indianDay(now),
    totals: {
      students: students.length,
      active: active.length,
      attempts: attempts.length,
      attempts14,
      students14: students14.size,
      satAny: lastAt.size,
      ready,
      neverSat: active.filter((s) => !lastAt.has(s.id)).length,
      quiet7: quietAll.length,
    },
    days,
    papers: paperRows,
    batteries,
    quiet,
    mocks: {
      finished: rows.mocks.length,
      students: mockStudents.size,
      qualified: mockQualified,
      byMock: byMockRows,
    },
  };
}

/** "2026-10-17" less n days, as a calendar day: no clock or zone involved. */
function dayBefore(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - n)).toISOString().slice(0, 10);
}

/** The page from the figures: rounded, ordered, every day and every battery present. */
export function assemble(agg: Aggregates, passT: number, targetT: number, now: number): Analytics {
  const papers: PaperDifficulty[] = agg.papers
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      battery: p.battery,
      published: p.published,
      students: p.students,
      attempts: p.attempts,
      meanPct: round1(p.meanPct),
      sdPct: round1(p.sdPct),
      passRate: p.measured ? Math.round((p.passed / p.measured) * 100) : null,
    }))
    .sort((a, b) => (a.meanPct ?? 101) - (b.meanPct ?? 101) || b.students - a.students || a.slug.localeCompare(b.slug));

  const batteries: BatteryReadiness[] = BATTERIES.map((b) => {
    const row = agg.batteries.find((r) => r.battery === b.id) ?? { sat: 0, passed: 0, target: 0, meanBestT: null };
    const hardest = papers.filter((p) => p.battery === b.id && p.meanPct !== null && p.students >= 5)[0] ?? papers.filter((p) => p.battery === b.id && p.meanPct !== null)[0];
    return {
      battery: b.id,
      title: b.title,
      sat: row.sat,
      passed: row.passed,
      target: row.target,
      meanBestT: round1(row.meanBestT),
      hardest: hardest
        ? {
            slug: hardest.slug,
            name: hardest.name,
            meanPct: hardest.meanPct as number,
          }
        : null,
    };
  });

  // The axis ends on the day the figures were cut, so the bars and the
  // fortnight's totals describe the same fourteen days whichever clock
  // (the database's or this one's) was a second ahead at midnight.
  const anchor = agg.today ?? indianDay(now);
  const byDay = new Map(agg.days.map((d) => [d.day, d]));
  const days: DayActivity[] = Array.from({ length: DAYS }, (_, i) => {
    const day = dayBefore(anchor, DAYS - 1 - i);
    const d = byDay.get(day);
    return { day, attempts: d?.attempts ?? 0, students: d?.students ?? 0 };
  });

  return {
    asOf: new Date(now).toISOString(),
    passT,
    targetT,
    days,
    totals: { ...agg.totals },
    batteries,
    papers,
    quiet: agg.quiet.slice(0, QUIET_LIMIT).map((s) => ({
      id: s.id,
      name: s.fullName || "Unnamed",
      phone: s.phone || "",
      lastAt: s.lastAt,
      attempts: s.attempts,
      bestT: round1(s.bestT),
    })),
    mocks: {
      finished: agg.mocks.finished,
      students: agg.mocks.students,
      qualified: agg.mocks.qualified,
      byMock: agg.mocks.byMock.map((m) => ({ ...m, meanOut30: round1(m.meanOut30) })),
    },
  };
}
