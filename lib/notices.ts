import { revalidateTag, unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The notice board: short announcements from the institute, shown at the
 * top of every student's dashboard until the date each one is set to
 * expire. Kept with the other portal settings, as one small list.
 */
export interface Notice {
  id: string;
  en: string;
  hi: string;
  /** YYYY-MM-DD of the last day it is shown; null for until removed. */
  until: string | null;
  createdAt: string;
}

const TAG = "portal-settings";
const KEY = "notices";
export const MAX_NOTICES = 20;

export async function listNotices(): Promise<Notice[]> {
  return unstable_cache(
    async () => {
      let supabase: ReturnType<typeof createAdminClient>;
      try {
        supabase = createAdminClient();
      } catch {
        return [];
      }
      const { data, error } = await supabase.from("portal_settings").select("value").eq("key", KEY).maybeSingle();
      if (error || !data) return [];
      const items = (data.value as { items?: Notice[] } | null)?.items;
      return Array.isArray(items) ? items.filter((n) => n && typeof n.id === "string") : [];
    },
    ["notices"],
    { tags: [TAG], revalidate: 300 },
  )();
}

/** The notices still on the board today (India). */
export function activeNotices(all: Notice[], todayIndia: string): Notice[] {
  return all.filter((n) => !n.until || n.until >= todayIndia);
}

export async function saveNotices(items: Notice[]): Promise<void> {
  const { error } = await createAdminClient()
    .from("portal_settings")
    .upsert({ key: KEY, value: { items: items.slice(0, MAX_NOTICES) }, updated_at: new Date().toISOString() });
  if (error) {
    throw new Error(
      /relation .* does not exist|schema cache|PGRST205/i.test(error.message)
        ? "The portal settings table does not exist yet — run the latest watch-table-schema.sql, then try again."
        : error.message,
    );
  }
  revalidateTag(TAG);
}
