/**
 * Sorting a pile of picture files into questions by their names.
 *
 * Two layouts are understood:
 *
 *  - one picture per question: q01.png, q02.png … (nothing to group);
 *  - a figure plus a picture per option: q01.png with q01-A.png … q01-E.png
 *    (or q01_A.png, q01 A.png, q01A.png — any separator or none, any case).
 *
 * Everything before the option letter is the question's key; files with the
 * same key belong together, and the keys are taken in natural order, so q2
 * comes before q10.
 */
export interface FileGroup<T extends { name: string }> {
  key: string;
  figure: T | null;
  /** Indexed by option letter, A first. */
  options: (T | undefined)[];
}

const OPTION_SUFFIX = /^(.+?)(?:[\s_\-]+|(?<=\d))([A-Za-z])$/;

function stem(name: string): string {
  return name.replace(/\.[^.]+$/, "").trim();
}

/** Groups files by question. Letters past `optionCount` are left as extra files. */
export function groupFigureFiles<T extends { name: string }>(
  files: T[],
  optionCount: number,
): { groups: FileGroup<T>[]; problems: string[] } {
  const byKey = new Map<string, FileGroup<T>>();
  const problems: string[] = [];
  const group = (key: string) => {
    const k = key.toLowerCase();
    let g = byKey.get(k);
    if (!g) {
      g = { key, figure: null, options: Array.from({ length: optionCount }) };
      byKey.set(k, g);
    }
    return g;
  };

  for (const file of files) {
    const base = stem(file.name);
    const m = OPTION_SUFFIX.exec(base);
    if (m) {
      const index = m[2].toUpperCase().charCodeAt(0) - 65;
      if (index >= 0 && index < optionCount) {
        const g = group(m[1]);
        if (g.options[index]) problems.push(`Two files for option ${m[2].toUpperCase()} of "${m[1]}": ${g.options[index]!.name} and ${file.name}`);
        g.options[index] = file;
        continue;
      }
    }
    const g = group(base);
    if (g.figure) problems.push(`Two figure files for "${base}": ${g.figure.name} and ${file.name}`);
    g.figure = file;
  }

  const groups = [...byKey.values()].sort((a, b) =>
    a.key.localeCompare(b.key, undefined, { numeric: true, sensitivity: "base" }),
  );
  for (const g of groups) {
    if (!g.figure) problems.push(`"${g.key}" has option pictures but no figure picture (expected ${g.key}.png)`);
    const missing = g.options
      .map((f, i) => (f ? null : String.fromCharCode(65 + i)))
      .filter((x): x is string => x !== null);
    if (missing.length > 0 && missing.length < optionCount) {
      problems.push(`"${g.key}" is missing option picture${missing.length === 1 ? "" : "s"} ${missing.join(", ")}`);
    }
  }
  return { groups, problems };
}
