/**
 * The day's plan, from the institute's rule: climb the three stages — pass
 * (42), average (50), target (60) — one battery at a time, weakest first.
 *
 *  - While any battery is below the pass bar: about ten sectional tests a
 *    day in all, most of them in the batteries below the bar.
 *  - Once every battery passes, while any is short of the target: seven to
 *    eight a day, spread by how far each battery still has to go.
 *  - A battery at the target keeps sharp with one test every third day.
 *  - Full Mocks open only once every battery has passed in sectional
 *    practice; then two a day.
 *
 * The rule lives here, not on the screen: the student sees the plan.
 */

export interface PlanInput {
  battery: number;
  title: string;
  bestT: number | null;
  today: number;
  lastAt: string | null;
}

export interface PlanRow {
  battery: number;
  title: string;
  bestT: number | null;
  stage: 1 | 2 | 3 | 4;
  /** What the stage asks for next: 42, 50, 60, or null when done. */
  next: number | null;
  target: number;
  done: number;
  /** A battery at the target: no daily count, just a nudge every third day. */
  keepSharp: boolean;
  due: boolean;
}

export interface Plan {
  rows: PlanRow[];
  sectionalTarget: number;
  sectionalDone: number;
  mocksUnlocked: boolean;
  mocksTarget: number;
}

export interface Stages {
  pass: number;
  average: number;
  target: number;
}

export const STAGES: Stages = { pass: 42, average: 50, target: 60 };

export function stageOf(bestT: number | null, s: Stages = STAGES): { stage: 1 | 2 | 3 | 4; next: number | null } {
  if (bestT === null || bestT < s.pass) return { stage: 1, next: s.pass };
  if (bestT < s.average) return { stage: 2, next: s.average };
  if (bestT < s.target) return { stage: 3, next: s.target };
  return { stage: 4, next: null };
}

export function planFor(
  batteries: PlanInput[],
  mocksDoneToday: number,
  now = Date.now(),
  s: Stages = STAGES,
): Plan {
  const anyBelowPass = batteries.some((b) => b.bestT === null || b.bestT < s.pass);
  const anyBelowTarget = batteries.some((b) => b.bestT === null || b.bestT < s.target);
  const total = anyBelowPass ? 10 : anyBelowTarget ? 8 : 0;

  // Weight: far below the bar counts most; a battery past the bar by how
  // far it still has to climb; at the target nothing.
  const weights = batteries.map((b) => {
    if (b.bestT === null) return 3;
    if (b.bestT < s.pass) return 3 + Math.min(2, (s.pass - b.bestT) / 10);
    if (b.bestT < s.target) return anyBelowPass ? 1 : 1 + (s.target - b.bestT) / 10;
    return 0;
  });
  const sum = weights.reduce((a, w) => a + w, 0);
  const raw = weights.map((w) => (sum > 0 ? (w / sum) * total : 0));
  // Whole tests, the remainder going to the heaviest, every working battery at least one.
  const counts = raw.map((r, i) => (weights[i] > 0 ? Math.max(1, Math.floor(r)) : 0));
  let left = total - counts.reduce((a, c) => a + c, 0);
  const order = weights.map((w, i) => [w, i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) {
    if (left <= 0) break;
    if (weights[i] > 0) {
      counts[i]++;
      left--;
    }
  }

  const rows: PlanRow[] = batteries.map((b, i) => {
    const { stage, next } = stageOf(b.bestT, s);
    const keepSharp = stage === 4;
    const since = b.lastAt ? (now - new Date(b.lastAt).getTime()) / 86400000 : Infinity;
    return {
      battery: b.battery,
      title: b.title,
      bestT: b.bestT,
      stage,
      next,
      target: keepSharp ? 0 : counts[i],
      done: b.today,
      keepSharp,
      due: keepSharp && since >= 3 && b.today === 0,
    };
  });

  const mocksUnlocked = !anyBelowPass;
  return {
    rows: rows.sort((a, b) => a.stage - b.stage || (a.bestT ?? -1) - (b.bestT ?? -1)),
    sectionalTarget: total,
    sectionalDone: rows.reduce((a, r) => a + Math.min(r.done, r.keepSharp ? r.done : r.target), 0),
    mocksUnlocked,
    mocksTarget: mocksUnlocked ? 2 : 0,
  };
}

/** Readiness against the target: 0 at T 30 or below, 100 at the target. */
export function readiness(bestTs: (number | null)[], target: number = STAGES.target): number {
  if (bestTs.length === 0) return 0;
  const parts = bestTs.map((t) => (t === null ? 0 : Math.max(0, Math.min(1, (t - 30) / (target - 30)))));
  return Math.round((parts.reduce((a, p) => a + p, 0) / parts.length) * 100);
}
