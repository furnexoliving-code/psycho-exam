"use server";

import { attempt, type SaveState } from "@/lib/admin-result";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { fileReport, MAX_NOTE } from "@/lib/reports";

/** A student's flag on a question in the review: "there is a mistake here". */
export async function reportQuestion(_prev: SaveState | null, formData: FormData): Promise<SaveState> {
  return attempt("Report", async () => {
    const slug = String(formData.get("paper") ?? "");
    const who = await requireUser(`/test/${slug}/result`);
    const questionId = String(formData.get("question") ?? "");
    const note = String(formData.get("note") ?? "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(questionId)) throw new Error("This question cannot be reported");
    if (note.length > MAX_NOTE) throw new Error(`Keep the note under ${MAX_NOTE} characters`);
    const { data: paper } = await createAdminClient().from("watch_papers").select("id").eq("slug", slug).maybeSingle();
    if (!paper) throw new Error("Paper not found");
    return await fileReport(who.id, paper.id as string, questionId, note);
  });
}
