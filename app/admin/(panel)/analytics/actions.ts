"use server";

import { revalidatePath } from "next/cache";
import { attempt, type SaveState } from "@/lib/admin-result";
import { requireResults } from "@/lib/auth";
import { analyticsChanged, refreshSnapshot } from "@/lib/wt/analytics";

/** Asks the database to cut the figures afresh, and drops the five-minute copy so the page shows them. */
export async function refreshAnalytics(_prev: SaveState | null, _formData: FormData): Promise<SaveState> {
  return attempt("Figures", async () => {
    await requireResults("/admin/analytics");
    const cut = await refreshSnapshot();
    analyticsChanged();
    revalidatePath("/admin/analytics");
    return cut ? "worked out afresh" : "the database works the figures out every ten minutes; the next cut will show";
  });
}
