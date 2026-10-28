"use server";

import { revalidatePath } from "next/cache";
import { attempt, type SaveState } from "@/lib/admin-result";
import { requireResults } from "@/lib/auth";
import { analyticsChanged, refreshSnapshot } from "@/lib/wt/analytics";

/** Asks the database for a fresh cut of the figures, and drops the five-minute copy so the page shows it once made. */
export async function refreshAnalytics(_prev: SaveState | null, _formData: FormData): Promise<SaveState> {
  return attempt("Figures", async () => {
    await requireResults("/admin/analytics");
    const asked = await refreshSnapshot();
    analyticsChanged();
    revalidatePath("/admin/analytics");
    return asked ? "a fresh cut is being made in the database; reload in a minute or two" : "worked out afresh";
  });
}
