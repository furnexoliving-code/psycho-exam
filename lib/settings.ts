import { revalidateTag, unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The institute's exam settings: the date of the real exam, which the
 * dashboard counts down to, and the T-score every battery should reach
 * by then. Passing needs 42; the institute's target is higher, and the
 * dashboard pushes every student towards it.
 */
export interface ExamSettings {
  /** YYYY-MM-DD, or null when not set. */
  examDate: string | null;
  /** The T-score to aim for in every battery. */
  targetT: number;
  /** The bar RRB sets: the T-score needed in every battery to pass. */
  passT: number;
}

const DEFAULTS: ExamSettings = { examDate: "2026-10-30", targetT: 60, passT: 42 };
const TAG = "portal-settings";
const KEY = "exam";

export async function examSettings(): Promise<ExamSettings> {
  return unstable_cache(
    async () => {
      let supabase: ReturnType<typeof createAdminClient>;
      try {
        supabase = createAdminClient();
      } catch {
        return DEFAULTS;
      }
      const { data, error } = await supabase.from("portal_settings").select("value").eq("key", KEY).maybeSingle();
      if (error || !data) return DEFAULTS;
      const v = (data.value ?? {}) as Partial<ExamSettings>;
      return {
        examDate: typeof v.examDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.examDate) ? v.examDate : null,
        targetT: Number.isFinite(Number(v.targetT)) && Number(v.targetT) > 0 ? Number(v.targetT) : DEFAULTS.targetT,
        passT: DEFAULTS.passT,
      };
    },
    ["exam-settings"],
    { tags: [TAG], revalidate: 300 },
  )();
}

export async function saveExamSettings(next: { examDate: string | null; targetT: number }): Promise<void> {
  const { error } = await createAdminClient()
    .from("portal_settings")
    .upsert({ key: KEY, value: { examDate: next.examDate, targetT: next.targetT }, updated_at: new Date().toISOString() });
  if (error) {
    throw new Error(
      /relation .* does not exist|schema cache|PGRST205/i.test(error.message)
        ? "The portal settings table does not exist yet — run the latest watch-table-schema.sql, then try again."
        : error.message,
    );
  }
  revalidateTag(TAG);
}

/** Whole days from today (in India) to the date; negative once it has passed. */
export function daysUntil(day: string, todayIndia: string): number {
  const a = Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)));
  const b = Date.UTC(Number(todayIndia.slice(0, 4)), Number(todayIndia.slice(5, 7)) - 1, Number(todayIndia.slice(8, 10)));
  return Math.round((a - b) / 86400000);
}
