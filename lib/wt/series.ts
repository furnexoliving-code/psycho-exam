import type { PaperSummary } from "./db";
import { BATTERIES, CATEGORIES } from "./categories";

/**
 * Practice is arranged as the hall arranges it: five batteries, and in
 * each a number of kinds of test (a series), each with its papers. A
 * series is a name on the paper; its address is the name made safe.
 */
export interface Series {
  battery: number;
  name: string;
  slug: string;
  papers: PaperSummary[];
}

export function seriesSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "series"
  );
}

export function batteryOf(category: string): number {
  return CATEGORIES.find((c) => c.id === category)?.battery ?? 2;
}

/** The papers grouped by battery, then by series, in list order. */
export function groupPapers(papers: PaperSummary[]): Map<number, Series[]> {
  const out = new Map<number, Series[]>();
  for (const b of BATTERIES) out.set(b.id, []);
  for (const p of papers) {
    const battery = batteryOf(p.category);
    const list = out.get(battery) ?? [];
    let s = list.find((x) => x.name === p.series);
    if (!s) {
      s = { battery, name: p.series, slug: seriesSlug(p.series), papers: [] };
      list.push(s);
    }
    s.papers.push(p);
    out.set(battery, list);
  }
  return out;
}
