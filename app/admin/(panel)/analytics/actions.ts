"use server";

import { revalidatePath } from "next/cache";
import { attempt, type SaveState } from "@/lib/admin-result";
import { requireResults } from "@/lib/auth";
import { analyticsChanged } from "@/lib/wt/analytics";

/** Drops the five-minute figures so the page works them out afresh. */
export async function refreshAnalytics(_prev: SaveState | null, _formData: FormData): Promise<SaveState> {
  return attempt("Figures", async () => {
    await requireResults("/admin/analytics");
    analyticsChanged();
    revalidatePath("/admin/analytics");
    return "worked out afresh";
  });
}
