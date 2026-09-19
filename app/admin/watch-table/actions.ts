"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { generateQuestions, optionValues } from "@/lib/wt/generate";
import { phrase, solve, type QuestionKind } from "@/lib/wt/engine";
import { parseQuestionLines } from "@/lib/wt/parse-questions";
import { parseInstructionLines } from "@/lib/wt/parse-instructions";
import { DIRECTIONS, type Direction, type WatchCell } from "@/lib/wt/types";

/**
 * Server actions behind the Watch Table admin panel.
 *
 * Every one re-checks that the caller is an admin: a server action is a public
 * endpoint, so a hidden button is never the security boundary.
 */

/** Human names for the question kinds, used as the default topic labels. */
const TOPIC_OF: Record<QuestionKind, string> = {
  "highest-frequency": "Most frequent number",
  "lowest-frequency": "Least frequent number",
  "opposite-of-alpha-last": "Opposite of last letter",
  "opposite-of-alpha-first": "Opposite of first letter",
  "middle-letter": "Middle letter",
  "alpha-last-value": "Alphabetically last letter",
  "alpha-first-value": "Alphabetically first letter",
};

function numberOrNull(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const n = Number(text);
  if (!Number.isFinite(n)) throw new Error(`"${text}" is not a number`);
  return n;
}

function nonNegativeOrNull(value: FormDataEntryValue | null): number | null {
  const n = numberOrNull(value);
  // A negative standard deviation is not a thing, and a zero one would make
  // the T-score divide by zero.
  if (n !== null && n < 0) throw new Error("Standard deviation cannot be negative");
  return n;
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || `paper-${Date.now()}`
  );
}

/** Reads the eight rim positions out of the diagram form. */
function readCells(formData: FormData, prefix = "cell"): WatchCell[] {
  const cells: WatchCell[] = [];

  for (const direction of DIRECTIONS) {
    const letter = String(formData.get(`${prefix}_${direction}_letter`) ?? "")
      .trim()
      .toUpperCase()
      .slice(0, 2);
    const value = Number(formData.get(`${prefix}_${direction}_value`) ?? 0);

    if (!letter) throw new Error(`${direction} has no letter`);
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`${direction} needs a whole number`);
    }
    cells.push({ direction: direction as Direction, letter, value });
  }

  const letters = cells.map((c) => c.letter);
  if (new Set(letters).size !== letters.length) {
    throw new Error("Two positions carry the same letter — each must be unique");
  }

  const distinct = new Set(cells.map((c) => c.value));
  if (distinct.size < 2) {
    throw new Error("The diagram needs at least two different numbers");
  }
  if (distinct.size > 5) {
    throw new Error(
      `The diagram uses ${distinct.size} different numbers, but a question shows only five options. Use at most five.`,
    );
  }

  return cells;
}

export async function createPaper(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const displayName =
    String(formData.get("display_name") ?? "").trim() || "Watch Table Test - 1";

  // A fresh paper starts with a generated diagram and a full set of questions,
  // so it is usable immediately rather than an empty shell.
  const { tables, questions } = generateQuestions({
    seed: Math.floor(Date.now() / 1000),
    count: 20,
    tableCount: 1,
  });

  const { data, error } = await supabase
    .from("watch_papers")
    .insert({
      slug: slugify(String(formData.get("slug") ?? "") || displayName),
      title: String(formData.get("title") ?? "").trim() || "Watch Table Test",
      display_name: displayName,
      instruction_time_min: 5,
      time_limit_min: 10,
      cells: tables[0].cells,
      example_cells: tables[0].cells,
      instructions: [],
      features: {},
    })
    .select("id, slug")
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("watch_questions").insert(
    questions.map((q, i) => ({
      paper_id: data.id,
      position: i,
      prompt_en: q.prompt.en,
      prompt_hi: q.prompt.hi,
      options: q.options,
      answer: q.answer,
      working_en: q.working.en,
      working_hi: q.working.hi,
    })),
  );

  redirect(`/admin/watch-table/${data.slug}`);
}

export async function saveSettings(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const slug = String(formData.get("slug"));
  const instruction = Number(formData.get("instruction_time_min"));
  const test = Number(formData.get("time_limit_min"));

  if (!Number.isInteger(instruction) || instruction < 1 || instruction > 120) {
    throw new Error("Instruction time must be between 1 and 120 minutes");
  }
  if (!Number.isInteger(test) || test < 1 || test > 300) {
    throw new Error("Test time must be between 1 and 300 minutes");
  }

  // Clamped rather than rejected: the control only offers valid steps, so a
  // value outside them means a hand-edited form, not a mistake worth a page of
  // error text.
  const fontScale = Math.min(2, Math.max(0.7, Number(formData.get("font_scale") ?? 1) || 1));

  const { error } = await supabase
    .from("watch_papers")
    .update({
      title: String(formData.get("title") ?? "").trim(),
      display_name: String(formData.get("display_name") ?? "").trim(),
      instruction_time_min: instruction,
      time_limit_min: test,
      is_published: formData.get("is_published") === "on",
      // Blank means "no reference" — the T-score then waits for a real cohort.
      reference_mean: numberOrNull(formData.get("reference_mean")),
      reference_sd: nonNegativeOrNull(formData.get("reference_sd")),
      cut_off_marks: numberOrNull(formData.get("cut_off_marks")),
      cut_off_tscore: numberOrNull(formData.get("cut_off_tscore")),
      expert_comment: String(formData.get("expert_comment") ?? "").trim() || null,
      stats_min_attempts: Math.max(1, Number(formData.get("stats_min_attempts") ?? 5)),
      font_scale: fontScale,
      features: {
        showInstructionsButton: formData.get("showInstructionsButton") === "on",
        showQuestionPaperButton: formData.get("showQuestionPaperButton") === "on",
        allowPause: formData.get("allowPause") === "on",
        allowFullscreen: formData.get("allowFullscreen") === "on",
        lockScroll: formData.get("lockScroll") === "on",
        overflowQuestions: formData.get("overflowQuestions") === "on",
      },
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/watch-table/${slug}`);
}

export async function saveDiagram(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const slug = String(formData.get("slug"));
  const cells = readCells(formData);

  const { error } = await supabase
    .from("watch_papers")
    .update({
      cells,
      example_cells: cells,
      image_url: String(formData.get("image_url") ?? "").trim() || null,
      image_width_pct: Math.min(
        100,
        Math.max(30, Math.round(Number(formData.get("image_width_pct") ?? 100) || 100)),
      ),
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/watch-table/${slug}`);
}

/**
 * Builds a whole paper of questions from the saved diagram.
 *
 * Every answer is computed from that diagram, and an instance whose question
 * would have two defensible answers is discarded rather than shipped — so a
 * generated paper cannot contain an unanswerable question.
 */
export async function regenerateQuestions(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const slug = String(formData.get("slug"));
  const count = Math.min(60, Math.max(1, Number(formData.get("count") ?? 20)));

  const { data: paper, error: readError } = await supabase
    .from("watch_papers")
    .select("id, cells")
    .eq("slug", slug)
    .single();
  if (readError) throw new Error(readError.message);

  const cells = (paper.cells ?? []) as WatchCell[];
  if (cells.length !== DIRECTIONS.length) {
    throw new Error("Save the diagram first — all eight positions are needed");
  }

  const table = { label: "No. 1", cells };
  const options = optionValues(table);

  const KINDS: QuestionKind[] = [
    "highest-frequency",
    "opposite-of-alpha-last",
    "middle-letter",
    "lowest-frequency",
    "opposite-of-alpha-first",
    "alpha-last-value",
    "alpha-first-value",
  ];

  // Enumerate every well-defined instance this diagram can pose, then take a
  // spread across kinds and across answers so the paper is not guessable.
  const pool: { kind: QuestionKind; from: Direction; to: Direction; hand: "right" | "left"; answer: number; workingEn: string; workingHi: string }[] = [];
  for (const kind of KINDS) {
    for (const from of DIRECTIONS) {
      for (const to of DIRECTIONS) {
        if (from === to) continue;
        for (const hand of ["right", "left"] as const) {
          const solved = solve(table, kind, from, to, hand);
          if (!solved) continue;
          pool.push({ kind, from, to, hand, ...solved });
        }
      }
    }
  }

  if (pool.length < count) {
    throw new Error(
      `This diagram can only pose ${pool.length} unambiguous questions. Ask for fewer, or change the numbers so they repeat less.`,
    );
  }

  const chosen: typeof pool = [];
  const usedByKind = new Map<QuestionKind, number[]>();

  while (chosen.length < count) {
    const minUses = Math.min(...KINDS.map((k) => (usedByKind.get(k) ?? []).length));
    let picked: (typeof pool)[number] | undefined;

    for (let pass = 0; pass < 3 && !picked; pass += 1) {
      picked = pool.find((c) => {
        if (chosen.includes(c)) return false;
        const used = usedByKind.get(c.kind) ?? [];
        if (pass < 2 && used.length > minUses) return false;
        if (pass === 0 && used.includes(c.answer)) return false;
        return true;
      });
    }

    if (!picked) break;
    chosen.push(picked);
    usedByKind.set(picked.kind, [...(usedByKind.get(picked.kind) ?? []), picked.answer]);
  }

  await supabase.from("watch_questions").delete().eq("paper_id", paper.id);

  const { error } = await supabase.from("watch_questions").insert(
    chosen.map((c, i) => ({
      paper_id: paper.id,
      position: i,
      prompt_en: phrase(c.kind, c.from, c.to, c.hand).en,
      prompt_hi: phrase(c.kind, c.from, c.to, c.hand).hi,
      // Rotating the option order per question keeps the answer from sitting
      // in the same slot every time.
      options: options.map((_, j) => options[(j + i) % options.length]),
      answer: c.answer,
      topic: TOPIC_OF[c.kind],
      working_en: c.workingEn,
      working_hi: c.workingHi,
    })),
  );

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/watch-table/${slug}`);
}

/**
 * Replaces the paper's questions with an uploaded set.
 *
 * Nothing is deleted until the whole batch has parsed, so a typo on line 30
 * cannot leave the paper half-empty.
 */
export async function importQuestions(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const slug = String(formData.get("slug"));
  const parsed = parseQuestionLines(String(formData.get("bulk") ?? ""));

  const { data: paper, error: readError } = await supabase
    .from("watch_papers")
    .select("id")
    .eq("slug", slug)
    .single();
  if (readError) throw new Error(readError.message);

  const append = formData.get("append") === "on";
  let offset = 0;

  if (append) {
    const { count } = await supabase
      .from("watch_questions")
      .select("id", { count: "exact", head: true })
      .eq("paper_id", paper.id);
    offset = count ?? 0;
  } else {
    await supabase.from("watch_questions").delete().eq("paper_id", paper.id);
  }

  const { error } = await supabase.from("watch_questions").insert(
    parsed.map((q, i) => ({
      paper_id: paper.id,
      position: offset + i,
      prompt_en: q.prompt_en,
      prompt_hi: q.prompt_hi,
      options: q.options,
      answer: q.answer,
      topic: q.topic,
      // Uploaded questions carry no derivation; the review screen just omits it.
      working_en: "",
      working_hi: "",
    })),
  );

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/watch-table/${slug}`);
}

export async function deleteQuestion(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const slug = String(formData.get("slug"));
  const { error } = await supabase
    .from("watch_questions")
    .delete()
    .eq("id", String(formData.get("id")));

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/watch-table/${slug}`);
}

export async function saveQuestion(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const slug = String(formData.get("slug"));
  const topic = String(formData.get("topic") ?? "").trim().slice(0, 60);
  const options = String(formData.get("options") ?? "")
    .split(/[,\s]+/)
    .map((v) => Number(v))
    .filter((v) => Number.isInteger(v));

  if (options.length < 2) throw new Error("A question needs at least two options");

  const answer = Number(formData.get("answer"));
  if (!options.includes(answer)) {
    throw new Error(`The answer ${answer} is not one of the options ${options.join(", ")}`);
  }

  const { error } = await supabase
    .from("watch_questions")
    .update({
      prompt_en: String(formData.get("prompt_en") ?? "").trim(),
      prompt_hi: String(formData.get("prompt_hi") ?? "").trim(),
      options,
      answer,
      topic,
    })
    .eq("id", String(formData.get("id")));

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/watch-table/${slug}`);
}

export async function deletePaper(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  // Questions go with it via ON DELETE CASCADE.
  const { error } = await supabase
    .from("watch_papers")
    .delete()
    .eq("slug", String(formData.get("slug")));

  if (error) throw new Error(error.message);
  redirect("/admin/watch-table");
}

/**
 * Replaces the instruction screen's wording and its worked example.
 *
 * Both are stored as bilingual paragraphs, so the English and Hindi columns
 * can never drift out of step: a paragraph exists in both languages or in
 * neither.
 */
export async function saveInstructions(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const slug = String(formData.get("slug"));
  const instructions = parseInstructionLines(String(formData.get("instructions") ?? ""));
  const exampleText = parseInstructionLines(String(formData.get("example_text") ?? ""));

  if (instructions.length === 0) {
    throw new Error("The instruction screen cannot be left blank");
  }

  const { error } = await supabase
    .from("watch_papers")
    .update({
      instructions,
      example_text: exampleText,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/watch-table/${slug}`);
}
