"use server";

import { revalidatePath } from "next/cache";
import { attempt, type SaveState } from "@/lib/admin-result";
import { requireEditor } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { resolveQuestion } from "@/lib/reports";

/** Clears a question's open flags once it has been looked at. */
export async function resolveReports(_prev: SaveState | null, formData: FormData): Promise<SaveState> {
  return attempt("Reports", async () => {
    await requireEditor("/admin/reports");
    const questionId = String(formData.get("question") ?? "");
    await resolveQuestion(questionId);
    revalidatePath("/admin/reports");
    revalidatePath("/admin");
    await logAction("Question reports cleared", questionId);
    return "cleared.";
  });
}
