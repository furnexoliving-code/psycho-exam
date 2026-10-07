"use server";

import { revalidatePath } from "next/cache";
import { attempt, type SaveState } from "@/lib/admin-result";
import { requireAdmin } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { saveExamSettings } from "@/lib/settings";
import { listNotices, MAX_NOTICES, saveNotices } from "@/lib/notices";

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

/** Puts a notice on every student's dashboard. */
export async function addNotice(_prev: SaveState | null, formData: FormData): Promise<SaveState> {
  return attempt("Notice", async () => {
    await requireAdmin("/admin/team");
    const en = String(formData.get("en") ?? "").trim();
    const hi = String(formData.get("hi") ?? "").trim();
    const until = String(formData.get("until") ?? "").trim();
    if (!en && !hi) throw new Error("Write the notice first");
    if (en.length > 400 || hi.length > 400) throw new Error("Keep a notice under 400 characters");
    if (until && !/^\d{4}-\d{2}-\d{2}$/.test(until)) throw new Error("The last day must be a date");
    const all = await listNotices();
    if (all.length >= MAX_NOTICES) throw new Error(`The board holds ${MAX_NOTICES} notices; remove an old one first`);
    await saveNotices([{ id: crypto.randomUUID(), en, hi, until: until || null, createdAt: new Date().toISOString() }, ...all]);
    revalidatePath("/admin/team");
    revalidatePath("/dashboard");
    await logAction("Notice added", en || hi);
    return "on the board.";
  });
}

export async function removeNotice(_prev: SaveState | null, formData: FormData): Promise<SaveState> {
  return attempt("Notice", async () => {
    await requireAdmin("/admin/team");
    const id = String(formData.get("id") ?? "");
    const all = await listNotices();
    await saveNotices(all.filter((n) => n.id !== id));
    revalidatePath("/admin/team");
    revalidatePath("/dashboard");
    await logAction("Notice removed", id);
    return "removed.";
  });
}
