"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Server actions behind the admin panel. Every one re-checks that the caller is
 * an admin — a server action is a public endpoint, so the UI hiding a button is
 * never the security boundary.
 */

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function createTest(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const nameEn = String(formData.get("name_en") ?? "").trim();
  if (!nameEn) throw new Error("Test name is required");

  const displayName = String(formData.get("display_name") ?? "").trim() || nameEn;
  const slug = slugify(String(formData.get("slug") ?? "") || nameEn) || `test-${Date.now()}`;

  const { data, error } = await supabase
    .from("tests")
    .insert({
      slug,
      name_en: nameEn,
      name_hi: String(formData.get("name_hi") ?? "").trim(),
      display_name: displayName,
      is_free: formData.get("is_free") === "on",
      is_published: false,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  redirect(`/admin/tests/${data.id}`);
}

export async function updateTest(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = String(formData.get("id"));
  const { error } = await supabase
    .from("tests")
    .update({
      name_en: String(formData.get("name_en") ?? "").trim(),
      name_hi: String(formData.get("name_hi") ?? "").trim(),
      display_name: String(formData.get("display_name") ?? "").trim(),
      is_free: formData.get("is_free") === "on",
      is_published: formData.get("is_published") === "on",
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/tests/${id}`);
  revalidatePath("/admin/tests");
}

export async function deleteTest(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  // Sections, blocks and questions go with it via ON DELETE CASCADE.
  const { error } = await supabase.from("tests").delete().eq("id", String(formData.get("id")));
  if (error) throw new Error(error.message);

  revalidatePath("/admin/tests");
  redirect("/admin/tests");
}

export async function createSection(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const testId = String(formData.get("test_id"));

  // Append to the end of the current order.
  const { count } = await supabase
    .from("sections")
    .select("id", { count: "exact", head: true })
    .eq("test_id", testId);

  const { data, error } = await supabase
    .from("sections")
    .insert({
      test_id: testId,
      kind: String(formData.get("kind") ?? "intelligence"),
      name_en: String(formData.get("name_en") ?? "").trim(),
      name_hi: String(formData.get("name_hi") ?? "").trim(),
      time_limit_min: Number(formData.get("time_limit_min") ?? 10),
      scored: formData.get("scored") === "on",
      position: count ?? 0,
      instructions: [],
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  // Every section needs at least one block to hang questions off.
  await supabase.from("blocks").insert({
    section_id: data.id,
    title_en: "Questions",
    title_hi: "प्रश्न",
    position: 0,
  });

  revalidatePath(`/admin/tests/${testId}`);
}

export async function updateSection(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = String(formData.get("id"));
  const testId = String(formData.get("test_id"));

  const instructionsRaw = String(formData.get("instructions_en") ?? "");
  const instructionsHiRaw = String(formData.get("instructions_hi") ?? "");
  const en = instructionsRaw.split("\n").map((l) => l.trim()).filter(Boolean);
  const hi = instructionsHiRaw.split("\n").map((l) => l.trim()).filter(Boolean);

  const { error } = await supabase
    .from("sections")
    .update({
      name_en: String(formData.get("name_en") ?? "").trim(),
      name_hi: String(formData.get("name_hi") ?? "").trim(),
      time_limit_min: Number(formData.get("time_limit_min") ?? 10),
      scored: formData.get("scored") === "on",
      // One instruction paragraph per line, paired up by index.
      instructions: en.map((line, i) => ({ en: line, hi: hi[i] ?? "" })),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/tests/${testId}`);
}

export async function deleteSection(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const testId = String(formData.get("test_id"));
  const { error } = await supabase
    .from("sections")
    .delete()
    .eq("id", String(formData.get("id")));

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/tests/${testId}`);
}

export async function saveQuestion(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const sectionId = String(formData.get("section_id"));
  const blockId = String(formData.get("block_id"));
  const testId = String(formData.get("test_id"));

  // Option rows come in as option_key_0 / option_label_0, …
  const choices: { key: string; label?: { en: string; hi: string } }[] = [];
  for (let i = 0; i < 8; i++) {
    const key = String(formData.get(`option_key_${i}`) ?? "").trim();
    if (!key) continue;
    const labelEn = String(formData.get(`option_label_en_${i}`) ?? "").trim();
    const labelHi = String(formData.get(`option_label_hi_${i}`) ?? "").trim();
    choices.push(
      labelEn || labelHi ? { key, label: { en: labelEn, hi: labelHi } } : { key },
    );
  }

  if (choices.length < 2) throw new Error("A question needs at least two options");

  const correctRaw = String(formData.get("correct") ?? "").trim();
  if (correctRaw && !choices.some((c) => c.key === correctRaw)) {
    throw new Error(`Correct answer "${correctRaw}" is not one of the options`);
  }

  const payload = {
    section_id: sectionId,
    block_id: blockId,
    prompt_en: String(formData.get("prompt_en") ?? "").trim(),
    prompt_hi: String(formData.get("prompt_hi") ?? "").trim(),
    choices,
    // Blank means unkeyed, as the personality test needs.
    correct: correctRaw || null,
  };

  if (!payload.prompt_en) throw new Error("Question text is required");

  if (id) {
    const { error } = await supabase.from("questions").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { count } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("section_id", sectionId);

    const { error } = await supabase
      .from("questions")
      .insert({ ...payload, position: count ?? 0 });
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/admin/tests/${testId}`);
}

export async function deleteQuestion(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const testId = String(formData.get("test_id"));
  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", String(formData.get("id")));

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/tests/${testId}`);
}

/**
 * Bulk import. Pasting a hundred questions one form at a time is not realistic
 * for a coaching institute, so the panel accepts a block of lines:
 *
 *   Question text | A. option | B. option | C. option | D. option | B
 *
 * The last field is the correct option key; leave it empty for unkeyed items.
 */
export async function importQuestions(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const sectionId = String(formData.get("section_id"));
  const blockId = String(formData.get("block_id"));
  const testId = String(formData.get("test_id"));
  const text = String(formData.get("bulk") ?? "");

  const { count } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("section_id", sectionId);

  const rows: Record<string, unknown>[] = [];
  let position = count ?? 0;

  for (const [index, line] of text.split("\n").entries()) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const parts = trimmed.split("|").map((p) => p.trim());
    if (parts.length < 3) {
      throw new Error(
        `Line ${index + 1}: expected "question | option | option | ... | answer"`,
      );
    }

    const prompt = parts[0];
    const correct = parts[parts.length - 1];
    const optionParts = parts.slice(1, -1);

    const choices = optionParts.map((option, i) => {
      // "B. some text" keeps B as the key; a bare option falls back to A, B, C…
      const match = option.match(/^([A-Za-z0-9]+)[.)]\s*(.*)$/);
      const key = match ? match[1].toUpperCase() : String.fromCharCode(65 + i);
      const label = match ? match[2] : option;
      return label ? { key, label: { en: label, hi: label } } : { key };
    });

    if (correct && !choices.some((c) => c.key === correct.toUpperCase())) {
      throw new Error(`Line ${index + 1}: answer "${correct}" is not one of the options`);
    }

    rows.push({
      section_id: sectionId,
      block_id: blockId,
      prompt_en: prompt,
      prompt_hi: "",
      choices,
      correct: correct ? correct.toUpperCase() : null,
      position: position++,
    });
  }

  if (rows.length === 0) throw new Error("Nothing to import");

  const { error } = await supabase.from("questions").insert(rows);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/tests/${testId}`);
}
