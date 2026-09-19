/**
 * The T-score a candidate is reported against their cohort.
 *
 *   T = 50 + 10 * (marks - mean) / sd
 *
 * A mean of the cohort scores 50; every standard deviation above or below moves
 * the score by 10.
 */

export interface Cohort {
  /** How many submitted papers the mean and sd were taken from. */
  count: number;
  mean: number;
  sd: number;
  /** Live cohort, or the reference figures an admin entered. */
  source: "cohort" | "reference";
}

export interface TScore {
  value: number;
  /**
   * The figures the value was computed from. Always present when tScore()
   * returns; omitted on the wire when the paper does not publish them, so a
   * hidden mean and sd do not travel to the browser inside the response.
   */
  cohort?: Cohort;
  /** Set when the figure needs explaining rather than just showing. */
  note?: string;
}

/**
 * Population standard deviation: the marks ARE the whole cohort for this
 * paper, not a sample drawn from a larger one, so the divisor is N.
 */
export function meanAndSd(marks: number[]): { mean: number; sd: number } {
  if (marks.length === 0) return { mean: 0, sd: 0 };

  const mean = marks.reduce((sum, m) => sum + m, 0) / marks.length;
  const variance =
    marks.reduce((sum, m) => sum + (m - mean) ** 2, 0) / marks.length;

  return { mean, sd: Math.sqrt(variance) };
}

/**
 * Returns null when there is nothing honest to report — too few papers and no
 * reference figures. Showing 50.0 in that case would look like a real result.
 */
export function tScore(marks: number, cohort: Cohort | null): TScore | null {
  if (!cohort) return null;

  // Everyone scoring the same leaves the formula dividing by zero. They are all
  // exactly average, which is what T = 50 means.
  if (cohort.sd === 0) {
    return {
      value: 50,
      cohort,
      note: "Every candidate so far has the same mark, so everyone is exactly average.",
    };
  }

  const value = 50 + 10 * ((marks - cohort.mean) / cohort.sd);

  return {
    value,
    cohort,
    note:
      cohort.source === "reference"
        ? "Measured against the reference figures set by your institute, not a live cohort."
        : undefined,
  };
}

export function formatTScore(value: number): string {
  return value.toFixed(1);
}
