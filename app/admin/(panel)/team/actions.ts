"use server";

import { revalidatePath } from "next/cache";
import { attempt, type SaveState } from "@/lib/admin-result";
import { requireAdmin } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { saveExamSettings } from "@/lib/settings";

/** The real exam's date and the T-score target every battery should reach. */
export async function updateExamSettings(_prev: SaveState | null, formData: FormData): Promise<SaveState> {
  return attempt("Exam settings", async () => {
    await requireAdmin("/admin/team");
    const date = String(formData.get("exam_date") ?? "").trim();
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("The exam date must be a date");
    const target = Number(formData.get("target_t"));
    if (!Number.isFinite(target) || target < 42 || target > 90) throw new Error("The target T-score must be between 42 and 90");
    await saveExamSettings({ examDate: date || null, targetT: target });
    revalidatePath("/admin/team");
    revalidatePath("/dashboard");
    await logAction("Exam settings changed", `exam ${date || "not set"}, target T ${target}`);
    return `exam ${date || "not set"}, target T ${target}`;
  });
}
