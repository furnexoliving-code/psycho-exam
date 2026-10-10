import { revalidateTag, unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { indianDay } from "@/lib/format-time";
import { cohortFor, fetchAll } from "./cohort";
import { tScore, type Cohort } from "./tscore";
import { BATTERIES } from "./categories";
import { batteryOf } from "./series";
import { scoreOutOf30, type MockTestResult } from "./mock";

const TAG = "admin-analytics";
const DAYS = 14;
const QUIET_AFTER_DAYS = 7;

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

interface PaperRow {
  id: string;
  slug: string;
  display_name: string;
  category: string;
  is_published: boolean;
  stats_min_attempts: number | null;
  reference_mean: number | null;
  reference_sd: number | null;
}
interface AttemptRow {
  user_id: string | null;
  paper_id: string;
  marks: number;
  total: number;
  submitted_at: string;
}
interface StudentRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  is_active: boolean;
}
interface MockRow {
  mock_id: string;
  user_id: string | null;
  tests: MockTestResult[] | null;
  qualified: boolean | null;
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
 * The whole batch in figures, worked out from every attempt on record.
 *
 * One pass over the attempts gives the cohorts (each student's latest
 * attempt per paper, as the database's own cohort function counts them),
 * each student's best marks per paper and so their best T-score per
 * battery, the day-by-day activity, and who has gone quiet.
 */
async function compute(passT: number, targetT: number): Promise<Analytics> {
  const supabase = createAdminClient();
  const now = Date.now();
  const [papersRes, attempts, students, mockRows, mockTestsRes] = await Promise.all([
    supabase.from("watch_papers").select("id, slug, display_name, category, is_published, stats_min_attempts, reference_mean, reference_sd"),
    fetchAll<AttemptRow>((from, to) => supabase.from("watch_attempts").select("user_id, paper_id, marks, total, submitted_at").order("submitted_at").order("id").range(from, to)),
    fetchAll<StudentRow>((from, to) => supabase.from("profiles").select("id, full_name, phone, is_active").eq("role", "student").order("created_at").order("id").range(from, to)),
    fetchAll<MockRow>((from, to) => supabase.from("mock_results").select("mock_id, user_id, tests, qualified").order("submitted_at").order("id").range(from, to)),
    supabase.from("mock_tests").select("id, slug, name, sort_order").order("sort_order").order("created_at"),
  ]);
  const papers = new Map(((papersRes.data as PaperRow[] | null) ?? []).map((p) => [p.id, p]));

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
    cohortMarks.set(key, [...(cohortMarks.get(key) ?? []), a.marks]);
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

  const paperRows: PaperDifficulty[] = [...perPaper.entries()]
    .map(([id, pp]) => {
      const paper = papers.get(id);
      if (!paper) return null;
      let measured = 0;
      let passed = 0;
      for (const who of pp.students) {
        const t = bestTByStudentPaper.get(who)?.get(id);
        if (t === undefined) continue;
        measured += 1;
        if (t >= passT) passed += 1;
      }
      return {
        id,
        slug: paper.slug,
        name: paper.display_name,
        battery: batteryOf(paper.category),
        published: paper.is_published,
        students: pp.students.size,
        attempts: pp.attempts,
        meanPct: round1(mean(pp.pcts)),
        sdPct: round1(sd(pp.pcts)),
        passRate: measured ? Math.round((passed / measured) * 100) : null,
      };
    })
    .filter((p): p is PaperDifficulty => p !== null)
    .sort((a, b) => (a.meanPct ?? 101) - (b.meanPct ?? 101) || b.students - a.students);

  const satBattery = new Map<number, Set<string>>();
  for (const a of attempts) {
    const paper = a.user_id ? papers.get(a.paper_id) : undefined;
    if (!paper) continue;
    const battery = batteryOf(paper.category);
    const set = satBattery.get(battery) ?? new Set<string>();
    set.add(a.user_id as string);
    satBattery.set(battery, set);
  }
  const batteries: BatteryReadiness[] = BATTERIES.map((b) => {
    const sat = satBattery.get(b.id) ?? new Set<string>();
    const ts: number[] = [];
    for (const who of sat) {
      const t = bestTByStudentBattery.get(who)?.get(b.id);
      if (t !== undefined) ts.push(t);
    }
    const hardest = paperRows.filter((p) => p.battery === b.id && p.meanPct !== null && p.students >= 5)[0] ?? paperRows.filter((p) => p.battery === b.id && p.meanPct !== null)[0];
    return {
      battery: b.id,
      title: b.title,
      sat: sat.size,
      passed: ts.filter((t) => t >= passT).length,
      target: ts.filter((t) => t >= targetT).length,
      meanBestT: round1(mean(ts)),
      hardest: hardest
        ? {
            slug: hardest.slug,
            name: hardest.name,
            meanPct: hardest.meanPct as number,
          }
        : null,
    };
  });

  const active = students.filter((s) => s.is_active);
  let ready = 0;
  for (const byBattery of bestTByStudentBattery.values()) {
    if (BATTERIES.every((b) => (byBattery.get(b.id) ?? -Infinity) >= passT)) ready += 1;
  }
  const quietRows = active
    .filter((s) => lastAt.has(s.id) && Date.parse(lastAt.get(s.id) as string) < since7)
    .map((s) => {
      const ts = [...(bestTByStudentBattery.get(s.id)?.values() ?? [])];
      return {
        id: s.id,
        name: s.full_name || "Unnamed",
        phone: s.phone || "",
        lastAt: lastAt.get(s.id) as string,
        attempts: attemptCount.get(s.id) ?? 0,
        bestT: ts.length ? round1(Math.max(...ts)) : null,
      };
    })
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt));

  const days: DayActivity[] = Array.from({ length: DAYS }, (_, i) => {
    const day = indianDay(now - (DAYS - 1 - i) * 86400000);
    const d = perDay.get(day);
    return { day, attempts: d?.attempts ?? 0, students: d?.students.size ?? 0 };
  });

  const mockMeta = new Map(((mockTestsRes.data ?? []) as { id: string; slug: string; name: string }[]).map((m) => [m.id, m]));
  const byMock = new Map<string, { sat: number; students: Set<string>; qualified: number; outs: number[] }>();
  const mockStudents = new Set<string>();
  let mockQualified = 0;
  for (const r of mockRows) {
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
    const out = scoreOutOf30(Array.isArray(r.tests) ? r.tests : []);
    if (out !== null) m.outs.push(out);
    byMock.set(r.mock_id, m);
  }
  const mockOrder = ((mockTestsRes.data ?? []) as { id: string }[]).map((m) => m.id);
  const byMockRows: MockSummary[] = [...byMock.entries()]
    .sort((a, b) => mockOrder.indexOf(a[0]) - mockOrder.indexOf(b[0]))
    .map(([id, m]) => ({
      slug: mockMeta.get(id)?.slug ?? "",
      name: mockMeta.get(id)?.name ?? "A deleted mock",
      sat: m.sat,
      students: m.students.size,
      qualified: m.qualified,
      meanOut30: round1(mean(m.outs)),
    }));

  return {
    asOf: new Date(now).toISOString(),
    passT,
    targetT,
    days,
    totals: {
      students: students.length,
      active: active.length,
      attempts: attempts.length,
      attempts14,
      students14: students14.size,
      satAny: lastAt.size,
      ready,
      neverSat: active.filter((s) => !lastAt.has(s.id)).length,
      quiet7: quietRows.length,
    },
    batteries,
    papers: paperRows,
    quiet: quietRows.slice(0, 30),
    mocks: {
      finished: mockRows.length,
      students: mockStudents.size,
      qualified: mockQualified,
      byMock: byMockRows,
    },
  };
}

/**
 * The batch's figures, kept for five minutes. Working them out reads every
 * attempt once; keeping them means an admin who opens the page ten times in
 * a morning costs the database one read, and the students' own pages none.
 */
export async function batchAnalytics(passT: number, targetT: number): Promise<Analytics> {
  return unstable_cache(() => compute(passT, targetT), ["admin-analytics", String(passT), String(targetT)], { tags: [TAG], revalidate: 300 })();
}

/** The admin asked for fresh figures: the next visit works them out again. */
export function analyticsChanged(): void {
  revalidateTag(TAG);
}
