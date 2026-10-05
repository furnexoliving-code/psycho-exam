import { revalidateTag, unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { CATEGORIES, HIDDEN_BATTERIES } from "./categories";

/**
 * Which batteries the student portal shows: a switch per battery, flipped
 * from the admin panel and kept in the portal settings. Until the admin
 * has flipped anything, the built-in list of batteries under test applies.
 *
 * Read from the shared cache, since every student page asks; emptied the
 * moment the admin flips a switch.
 */
const TAG = "portal-settings";
const KEY = "hidden_batteries";

export async function hiddenBatteries(): Promise<number[]> {
  return unstable_cache(
    async () => {
      // A missing service key must not break a student page: the built-in list stands.
      let supabase: ReturnType<typeof createAdminClient>;
      try {
        supabase = createAdminClient();
      } catch {
        return [...HIDDEN_BATTERIES];
      }
      const { data, error } = await supabase
        .from("portal_settings")
        .select("value")
        .eq("key", KEY)
        .maybeSingle();
      // A table not yet created, or no row: the built-in list stands.
      if (error || !data) return [...HIDDEN_BATTERIES];
      const value = data.value as unknown;
      return Array.isArray(value) ? value.map(Number).filter((n) => Number.isInteger(n)) : [...HIDDEN_BATTERIES];
    },
    ["hidden-batteries"],
    { tags: [TAG], revalidate: 300 },
  )();
}

/** True when a category's battery is open to students, given the hidden list. */
export function openToStudents(categoryId: string | null | undefined, hidden: readonly number[]): boolean {
  const category = CATEGORIES.find((c) => c.id === categoryId);
  if (!category) return true;
  return !hidden.includes(category.battery);
}

/** Hides or shows one battery on the student portal. Admin only; the caller checks. */
export async function setBatteryHidden(battery: number, hidden: boolean): Promise<void> {
  const current = await hiddenBatteries();
  const next = hidden
    ? [...new Set([...current, battery])].sort()
    : current.filter((b) => b !== battery);
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("portal_settings")
    .upsert({ key: KEY, value: next, updated_at: new Date().toISOString() });
  if (error) {
    throw new Error(
      /relation .* does not exist|schema cache|PGRST205/i.test(error.message)
        ? "The portal settings table does not exist yet — run the latest watch-table-schema.sql, then try again."
        : error.message,
    );
  }
  revalidateTag(TAG);
}
