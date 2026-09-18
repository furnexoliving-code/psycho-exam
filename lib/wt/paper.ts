import type { WatchPaper } from "./types";
import bundled from "@/data/watch-table-1.json";

/**
 * The bundled sample paper. Admin-created papers come from Supabase; this one
 * ships with the repo so the portal works before any setup.
 */
export const SAMPLE_PAPER = bundled as unknown as WatchPaper;

export const DEFAULT_PAPER_ID = SAMPLE_PAPER.id;

export function getBundledPaper(paperId: string): WatchPaper | undefined {
  return paperId === SAMPLE_PAPER.id ? SAMPLE_PAPER : undefined;
}
