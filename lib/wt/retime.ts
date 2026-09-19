/**
 * Rewrites the timings named in a paragraph of the sample's instructions —
 * "5 minutes to read … 10 minute clock", in English and Hindi — to another
 * paper's limits.
 *
 * One pass, one regular expression: two chained replacements let the output
 * of the first be matched by the second (a reading time of 10 became "10
 * minutes", which the "10 minute" rule then rewrote as the test time). The
 * boundary is only before the number: \b is ASCII-only in JavaScript and a
 * boundary after the unit would never match "मिनट".
 */
export function retime(
  text: string,
  from: { read: number; test: number },
  to: { read: number; test: number },
): string {
  const pattern = new RegExp(
    `\\b(?:(${from.read}) (minutes|मिनट)|(${from.test}) (minute|मिनट))`,
    "g",
  );
  return text.replace(pattern, (_match, read: string | undefined, readUnit: string, _test, testUnit: string) =>
    read !== undefined ? `${to.read} ${readUnit}` : `${to.test} ${testUnit}`,
  );
}
