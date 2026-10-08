import type { PaperSummary } from "./db";
import { BATTERIES, CATEGORIES } from "./categories";
import { SECTIONS, sectionOf, type Section } from "./sections";

/**
 * Practice is arranged as the hall arranges it: five batteries, and in
 * each a number of kinds of test (a series), each with its papers. A
 * series is a section of the hall's test index when its papers' series
 * name is one (lib/wt/sections.ts), and its address is then the section's
 * name made safe; a series the index does not know keeps the name the
 * admin gave it.
 */
export interface Series {
  battery: number;
  name: string;
  slug: string;
  papers: PaperSummary[];
  /** The hall's section this series is, when it is one. */
  section?: Section;
  /** Every address the series answers to: its own, and the series names merged into it. */
  slugs: string[];
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

/**
 * The papers grouped by battery, then by series: the hall's sections in
 * the hall's order first (only those with papers), then any series the
 * index does not know, in list order.
 */
export function groupPapers(papers: PaperSummary[]): Map<number, Series[]> {
  const out = new Map<number, Series[]>();
  for (const b of BATTERIES) out.set(b.id, []);
  for (const p of papers) {
    const battery = batteryOf(p.category);
    const list = out.get(battery) ?? [];
    const section = sectionOf(p.series, p.category);
    const name = section?.name ?? p.series;
    let s = list.find((x) => (section ? x.section === section : !x.section && x.name === name));
    if (!s) {
      s = { battery, name, slug: seriesSlug(name), papers: [], section, slugs: [seriesSlug(name)] };
      list.push(s);
    }
    const own = seriesSlug(p.series);
    if (!s.slugs.includes(own)) s.slugs.push(own);
    s.papers.push(p);
    out.set(battery, list);
  }
  for (const [battery, list] of out) {
    list.sort((a, b) => rank(a) - rank(b));
    out.set(battery, list);
  }
  return out;
}

function rank(s: Series): number {
  return s.section ? SECTIONS.indexOf(s.section) : SECTIONS.length + 1;
}

/** The series at an address: its own, or one of the series names merged into it. */
export function findSeries(list: Series[], slug: string): Series | undefined {
  return list.find((s) => s.slug === slug) ?? list.find((s) => s.slugs.includes(slug));
}
