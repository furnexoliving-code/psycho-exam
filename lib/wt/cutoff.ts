/**
 * The cut-off verdict — ONE implementation, shared by the candidate's result
 * and the admin's results table.
 *
 * It used to live twice, and the copies disagreed: the admin's version always
 * applied the marks bar while the candidate's honoured the institute's switch,
 * so staff and student could be shown opposite verdicts for the same paper.
 */

export interface CutOffRule {
  marks: number | null;
  tScore: number | null;
}

export interface CutOffVerdict {
  /** The marks bar's threshold, or null when that bar does not apply. */
  marks: number | null;
  tScore: number | null;
  /**
   * true / false once decided. null when it CANNOT be decided yet — a T-score
   * bar is set but there is no T-score to judge it by. Reported as undecided
   * rather than as a failure, because "Not qualified" in red for a paper that
   * has not been judged is a false verdict.
   */
  qualified: boolean | null;
  /** What was measured against what, in the candidate's terms. */
  reason: string;
}

export interface CutOffOptions {
  /** Whether the marks bar counts at all. Off means T-score alone decides. */
  useMarks: boolean;
  /**
   * Whether the candidate is shown their T-score figure. When not, the reason
   * still says which way the bar went, but never prints the number the
   * institute chose to withhold.
   */
  showTScore: boolean;
}

/**
 * A T-score is displayed to one decimal, so it is judged to one decimal.
 * Otherwise 41.96 prints as "42.0" beside "needed 42" and reads as a pass
 * while being scored as a fail.
 */
function shown(t: number): number {
  return Number(t.toFixed(1));
}

export function decideCutOff(
  rule: CutOffRule,
  marks: number,
  t: number | null,
  opts: CutOffOptions,
): CutOffVerdict | null {
  const marksBar = rule.marks !== null && opts.useMarks ? rule.marks : null;
  const tBar = rule.tScore;

  // Nothing to judge against: no banner at all.
  if (marksBar === null && tBar === null) return null;

  // A T-score bar that cannot be judged yet leaves the whole verdict open. It
  // is not decided on the marks bar alone in the meantime — that would declare
  // a candidate qualified who may fail the T-score bar once it exists.
  if (tBar !== null && t === null) {
    return {
      marks: marksBar,
      tScore: tBar,
      qualified: null,
      reason:
        "Waiting for enough papers to be submitted before a T-score can be calculated.",
    };
  }

  const byMarks = marksBar === null ? null : marks >= marksBar;
  const byT = tBar === null || t === null ? null : shown(t) >= tBar;

  const parts: string[] = [];
  if (byMarks !== null) parts.push(`scored ${marks}, needed ${marksBar}`);
  if (byT !== null && t !== null) {
    parts.push(
      opts.showTScore
        ? `T-score ${shown(t).toFixed(1)}, needed ${tBar}`
        : `T-score ${byT ? "cleared" : "below"} the required ${tBar}`,
    );
  }

  const checks = [byMarks, byT].filter((v): v is boolean => v !== null);

  return {
    marks: marksBar,
    tScore: tBar,
    // Every bar that applies must be cleared.
    qualified: checks.every(Boolean),
    reason: parts.join(" · "),
  };
}
