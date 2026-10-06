"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { attempt, run, type SaveState } from "@/lib/admin-result";
import { requireAdmin, requireEditor } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { fromIndianLocalInput } from "@/lib/format-time";
import { logAction } from "@/lib/audit";
import { mocksChanged, papersOf } from "@/lib/wt/mock";
import { BATTERIES } from "@/lib/wt/categories";

const BACK = "/admin/mocks";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** A new mock, as a draft, then its editor. */
export async function createMock(formData: FormData) {
  return run(BACK, "New Full Mock", async () => {
    await requireEditor(BACK);
    const name = String(formData.get("name") ?? "").trim();
    if (!name) throw new Error("Give the mock a name, such as Full Mock 1");
    const slug = slugify(String(formData.get("slug") ?? "") || name) || `mock-${Date.now()}`;

    const { data, error } = await createAdminClient()
      .from("mock_tests")
      .insert({ name, slug })
      .select("slug")
      .single();
    if (error) {
      throw new Error(
        /duplicate key|unique/i.test(error.message)
          ? "That web address is already taken by another mock. Choose a different one."
          : /relation .* does not exist|schema cache|PGRST205/i.test(error.message)
            ? "The Full Mock tables do not exist yet — run the latest watch-table-schema.sql, then try again."
            : error.message,
      );
    }
    mocksChanged();
    await logAction("Full Mock created", `${name} (${data.slug})`);
    redirect(`/admin/mocks/${data.slug}`);
  });
}

/** Saves the mock's papers, window, limits and publish switch. */
export async function saveMock(_prev: SaveState | null, formData: FormData): Promise<SaveState> {
  return attempt("Full Mock", async () => {
    await requireEditor(BACK);
    const slug = String(formData.get("slug") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    if (!name) throw new Error("The name cannot be blank");

    // One paper per battery, in the hall's order. A battery left blank is
    // simply not in this mock.
    const paperIds = BATTERIES.map((b) => String(formData.get(`paper_${b.id}`) ?? "")).filter(Boolean);
    const publish = formData.get("is_published") === "on";
    const papers = await papersOf(paperIds);
    if (publish) {
      if (papers.length === 0) throw new Error("Choose the papers before publishing");
      const notReady = papers.filter((p) => !p.isPublished || p.questionCount === 0);
      if (notReady.length) {
        throw new Error(`Not ready to publish: ${notReady.map((p) => p.displayName).join(", ")} ${notReady.length === 1 ? "is" : "are"} unpublished or without questions`);
      }
    }

    const gap = Number(formData.get("gap_min"));
    if (!Number.isInteger(gap) || gap < 0 || gap > 30) throw new Error("The gap must be 0 to 30 minutes");
    const cutOff = Number(formData.get("cut_off_tscore"));
    if (!Number.isFinite(cutOff) || cutOff < 0 || cutOff > 100) throw new Error("The cut-off T-score must be 0 to 100");
    const attemptsRaw = String(formData.get("max_attempts") ?? "").trim();
    const maxAttempts = attemptsRaw === "" ? null : Number(attemptsRaw);
    if (maxAttempts !== null && (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 100)) {
      throw new Error("Attempts must be 1 to 100, or blank for no limit");
    }
    const opensAt = fromIndianLocalInput(String(formData.get("opens_at") ?? ""));
    const closesAt = fromIndianLocalInput(String(formData.get("closes_at") ?? ""));
    if (opensAt && closesAt && closesAt <= opensAt) throw new Error("The mock must close after it opens");
    const sortOrder = Number(formData.get("sort_order") ?? 0) || 0;

    const { data, error } = await createAdminClient()
      .from("mock_tests")
      .update({
        name,
        paper_ids: paperIds,
        gap_min: gap,
        cut_off_tscore: cutOff,
        max_attempts: maxAttempts,
        opens_at: opensAt,
        closes_at: closesAt,
        is_published: publish,
        sort_order: sortOrder,
        updated_at: new Date().toISOString(),
      })
      .eq("slug", slug)
      .select("id");
    if (error) throw new Error(error.message);
    if (!data?.length) throw new Error("That mock no longer exists");

    mocksChanged();
    revalidatePath(`/admin/mocks/${slug}`);
    revalidatePath(BACK);
    await logAction(publish ? "Full Mock saved (published)" : "Full Mock saved (draft)", `${name} (${slug}), ${papers.length} tests`);
    return publish ? "published" : "saved as draft";
  });
}

/** Removes a mock and its sittings and results. The papers stay. */
export async function deleteMock(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  return run(`/admin/mocks/${slug}`, "Delete", async () => {
    await requireAdmin(BACK);
    const { data, error } = await createAdminClient().from("mock_tests").delete().eq("slug", slug).select("name");
    if (error) throw new Error(error.message);
    if (!data?.length) throw new Error("That mock no longer exists");
    mocksChanged();
    await logAction("Full Mock deleted", `${data[0].name} (${slug}), with its results`);
    redirect(`${BACK}?saved=${encodeURIComponent(`Deleted — ${data[0].name}`)}`);
  });
}
