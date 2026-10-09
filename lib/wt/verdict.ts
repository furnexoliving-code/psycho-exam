import type { CutOffVerdict } from "./cutoff";

/** The hall's own bar: a T-score of 42 in every test of the battery. */
export const HALL_T_BAR = 42;

export interface Verdict {
  ok: boolean;
  /** "Qualified" or "Below cut-off". */
  label: string;
  /** What decided it, in the candidate's terms: "T-Score 60.0 ≥ 42". */
  note: string;
  /** How far short, in the bar's own unit, when below; 0 when qualified. */
  short: number;
}

/**
 * One word on the result, for the scorecard and the shared picture: the
 * institute's own cut-off when it has set one and it is decided, else the
 * hall's bar of 42 against the T-score. Nothing when there is no T-score
 * and no marks bar to judge by: a verdict guessed is worse than none.
 */
export function verdictOf(cutOff: CutOffVerdict | null, t: number | null, marks: number): Verdict | null {
  if (cutOff && cutOff.qualified !== null) {
    if (cutOff.tScore !== null && t !== null) {
      const shown = Number(t.toFixed(1));
      const short = Math.max(0, Number((cutOff.tScore - shown).toFixed(1)));
      return cutOff.qualified
        ? { ok: true, label: "Qualified", note: `T-Score ${shown.toFixed(1)} ≥ ${cutOff.tScore}`, short: 0 }
        : { ok: false, label: "Below cut-off", note: `need +${short.toFixed(1)} T-Score (bar ${cutOff.tScore})`, short };
    }
    if (cutOff.marks !== null) {
      const short = Math.max(0, cutOff.marks - marks);
      return cutOff.qualified
        ? { ok: true, label: "Qualified", note: `${marks} marks ≥ ${cutOff.marks}`, short: 0 }
        : { ok: false, label: "Below cut-off", note: `need +${short} marks (bar ${cutOff.marks})`, short };
    }
  }
  if (t === null) return null;
  const shown = Number(t.toFixed(1));
  if (shown >= HALL_T_BAR) return { ok: true, label: "Qualified", note: `T-Score ${shown.toFixed(1)} ≥ ${HALL_T_BAR}`, short: 0 };
  const short = Number((HALL_T_BAR - shown).toFixed(1));
  return { ok: false, label: "Below cut-off", note: `need +${short.toFixed(1)} T-Score (bar ${HALL_T_BAR})`, short };
}

/** The pace the hall asks and the pace sat, for the time panel and the card. */
export function paceOf(takenSec: number | null, allowedSec: number, attempted: number, total: number) {
  if (takenSec === null || total <= 0) return null;
  const need = allowedSec / total;
  const mine = attempted > 0 ? takenSec / attempted : null;
  // How many the paper's clock would let through at this pace.
  const reach = mine && mine > 0 ? Math.min(total, Math.floor(allowedSec / mine)) : null;
  return { need, mine, reach };
}

/** "5 sec", "12 sec", "1 min 5 sec". */
export function secs(n: number): string {
  if (n < 60) return `${n < 10 ? n.toFixed(1) : Math.round(n)} sec`;
  const m = Math.floor(n / 60);
  const s = Math.round(n - m * 60);
  return s ? `${m} min ${s} sec` : `${m} min`;
}
