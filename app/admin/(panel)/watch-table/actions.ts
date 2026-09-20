"use server";

import { revalidatePath } from "next/cache";
import { attempt, run, type SaveState } from "@/lib/admin-result";
import { redirect } from "next/navigation";
import { requireAdmin, requireEditor } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateQuestions, optionValues } from "@/lib/wt/generate";
import { phrase, solve, type QuestionKind } from "@/lib/wt/engine";
import { MAX_OPTION, parseQuestionLines } from "@/lib/wt/parse-questions";
import { parseInstructionLines } from "@/lib/wt/parse-instructions";
import { paperChanged } from "@/lib/wt/db";
import { CATEGORIES } from "@/lib/wt/categories";
import { DIRECTIONS, type Direction, type WatchCell } from "@/lib/wt/types";

/**
 * Server actions behind the Watch Table admin panel.
 *
 * Every one re-checks that the caller is an admin: a server action is a public
 * endpoint, so a hidden button is never the security boundary.
 */

/**
 * The client used for the questions table.
 *
 * SELECT on watch_questions is revoked from `authenticated` so a candidate
 * cannot read the answer column off the table directly. An admin's session is
 * also `authenticated`, so the panel would be locked out of its own questions
 * — it uses the service-role client instead. Every caller has already passed
 * requireEditor(), which is the real boundary.
 */
const questionStore = createAdminClient;

/**
 * What to say when a write reports no error but changes nothing.
 *
 * Postgres row level security refuses an UPDATE by matching no rows, not by
 * raising an error, so this is indistinguishable from success unless the rows
 * are read back.
 */
/** The result switches, named once so the form and the save cannot drift. */
const RESULT_VIEW_KEYS = [
  "tScore",
  "tScoreFormula",
  "tScoreStats",
  "cutOff",
  "cutOffMarks",
  "rank",
  "percentile",
  "accuracy",
  "expertComment",
  "topicBreakdown",
  "timeAnalysis",
  "attemptHistory",
  "review",
  "correctAnswers",
] as const;

const NOTHING_CHANGED =
  "the database accepted the request but changed nothing. This usually means your " +
  "account is not an admin there — check the role on your row in the profiles table.";

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

/**
 * A picture's address, or null for none. Only a web address is accepted: the
 * value goes straight into <img src> on every candidate's screen, and a
 * pasted data: blob would ride along inside every render of the exam.
 */
function imageUrlOrNull(value: FormDataEntryValue | null): string | null {
  const url = String(value ?? "").trim();
  if (!url) return null;
  if (!/^https:\/\/\S+$/i.test(url) || url.length > 2048) {
    throw new Error("The picture must be a web address starting with https://");
  }
  return url;
}

/** A whole number, or the fallback when the field is blank or not a number. */
function wholeNumber(value: FormDataEntryValue | null, fallback: number): number {
  const n = numberOrNull(value);
  if (n === null) return fallback;
  if (!Number.isInteger(n)) throw new Error(`${value} is not a whole number`);
  return n;
}

function positiveOrNull(value: FormDataEntryValue | null): number | null {
  const n = numberOrNull(value);
  // A negative standard deviation is not a thing, and a zero one would make
  // every candidate exactly average whatever they scored.
  if (n !== null && n <= 0) throw new Error("Standard deviation must be greater than zero");
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
    if (!Number.isInteger(value) || value < 0 || value >= MAX_OPTION) {
      throw new Error(`${direction} needs a whole number below a million`);
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
  // A failure — a web address already taken, most often — lands back on the
  // list with its reason, rather than on the generic error page.
  return run("/admin/watch-table", "New paper", async () => {
  await requireEditor();
  const supabase = await createClient();

  const displayName =
    String(formData.get("display_name") ?? "").trim() || "Watch Table Test - 1";

  const wanted = String(formData.get("category") ?? "watch");
  const category = CATEGORIES.some((c) => c.id === wanted) ? wanted : "watch";

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
      category,
    })
    .select("id, slug")
    .single();

  if (error) {
    throw new Error(
      /duplicate key|unique/i.test(error.message)
        ? "That web address is already taken by another paper. Choose a different one, or leave it blank."
        : error.message,
    );
  }

  const { error: questionError } = await questionStore().from("watch_questions").insert(
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
  if (questionError) throw new Error(questionError.message);

  paperChanged(data.slug);
  redirect(`/admin/watch-table/${data.slug}`);
  });
}

export async function saveSettings(
  _prev: SaveState | null,
  formData: FormData,
): Promise<SaveState> {
  const slug = String(formData.get("slug"));
  return attempt("Settings", async () => {
    await requireEditor();
    const supabase = await createClient();

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

    // Blank means no limit, which is what every paper did before limits
    // existed — so an admin who never touches this field changes nothing.
    const attemptsRaw = String(formData.get("max_attempts") ?? "").trim();
    let maxAttempts: number | null = null;
    if (attemptsRaw) {
      const n = Number(attemptsRaw);
      if (!Number.isInteger(n) || n < 1 || n > 100) {
        throw new Error("Attempts allowed must be a whole number between 1 and 100, or blank for no limit");
      }
      maxAttempts = n;
    }

    // Read every switch by name. An unchecked box sends nothing at all, so
    // each one has to be asked for explicitly rather than inferred from what
    // arrived — otherwise turning a panel off would silently re-enable it.
    // Anything unknown falls back to the watch table rather than being stored
    // and then failing the database's own check.
    const raw = String(formData.get("category") ?? "watch");
    const category = CATEGORIES.some((c) => c.id === raw) ? raw : "watch";

    // Blank is 0, which is what every paper already had — so an admin who
    // never touches this field leaves the order exactly as it was.
    const orderRaw = String(formData.get("sort_order") ?? "").trim();
    const sortOrder = orderRaw ? Math.trunc(Number(orderRaw) || 0) : 0;
    if (Math.abs(sortOrder) > 1_000_000) {
      throw new Error("The order in the list must be between -1000000 and 1000000");
    }

    const displayName = String(formData.get("display_name") ?? "").trim();
    if (!displayName) throw new Error("The name shown in the toolbar cannot be blank");

    const minAttempts = wholeNumber(formData.get("stats_min_attempts"), 5);
    if (minAttempts < 1 || minAttempts > 100_000) {
      throw new Error("Switch to live figures after: give a whole number from 1 to 100000");
    }

    const cutOffMarks = numberOrNull(formData.get("cut_off_marks"));
    if (cutOffMarks !== null && (!Number.isInteger(cutOffMarks) || cutOffMarks < 0)) {
      throw new Error("Cut-off marks must be a whole number, 0 or more");
    }

    const resultView = Object.fromEntries(
      RESULT_VIEW_KEYS.map((k) => [k, formData.get(`rv_${k}`) === "on"]),
    );

    const { data: updated, error } = await supabase
      .from("watch_papers")
      .update({
        title: String(formData.get("title") ?? "").trim() || "Watch Table Test",
        display_name: displayName,
        instruction_time_min: instruction,
        time_limit_min: test,
        is_published: formData.get("is_published") === "on",
        // Blank means "no reference" — the T-score then waits for a real cohort.
        reference_mean: numberOrNull(formData.get("reference_mean")),
        reference_sd: positiveOrNull(formData.get("reference_sd")),
        cut_off_marks: cutOffMarks,
        cut_off_tscore: numberOrNull(formData.get("cut_off_tscore")),
        expert_comment: String(formData.get("expert_comment") ?? "").trim() || null,
        stats_min_attempts: minAttempts,
        font_scale: fontScale,
        max_attempts: maxAttempts,
        result_view: resultView,
        category,
        sort_order: sortOrder,
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
      .eq("slug", slug)
      .select("id");

    if (error) throw new Error(error.message);
    if (!updated?.length) throw new Error(NOTHING_CHANGED);
    revalidatePath(`/admin/watch-table/${slug}`);
    paperChanged(slug);  });
}

export async function saveDiagram(
  _prev: SaveState | null,
  formData: FormData,
): Promise<SaveState> {
  const slug = String(formData.get("slug"));
  return attempt("Diagram", async () => {
    await requireEditor();
    const supabase = await createClient();

      const cells = readCells(formData);

    const { data: updated, error } = await supabase
      .from("watch_papers")
      .update({
        cells,
        example_cells: cells,
        image_url: imageUrlOrNull(formData.get("image_url")),
        image_width_pct: Math.min(
          100,
          Math.max(30, Math.round(Number(formData.get("image_width_pct") ?? 100) || 100)),
        ),
        updated_at: new Date().toISOString(),
      })
      .eq("slug", slug)
      .select("id");

    if (error) throw new Error(error.message);
    if (!updated?.length) throw new Error(NOTHING_CHANGED);
    revalidatePath(`/admin/watch-table/${slug}`);
    paperChanged(slug);  });
}

/**
 * Builds a whole paper of questions from the saved diagram.
 *
 * Every answer is computed from that diagram, and an instance whose question
 * would have two defensible answers is discarded rather than shipped — so a
 * generated paper cannot contain an unanswerable question.
 */
export async function regenerateQuestions(
  _prev: SaveState | null,
  formData: FormData,
): Promise<SaveState> {
  return attempt("Sample questions", async () => {
  await requireEditor();
  const supabase = await createClient();

  const slug = String(formData.get("slug"));
  const count = wholeNumber(formData.get("count"), 20);
  if (count < 1 || count > 60) throw new Error("Ask for between 1 and 60 questions");

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

  const { error } = await replaceQuestions(
    paper.id,
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

  // Emptied whatever happened: the new rows may be in even when the old
  // ones could not be removed, and the cache must show what the database holds.
  revalidatePath(`/admin/watch-table/${slug}`);
  paperChanged(slug);
  if (error) throw new Error(error);
  return `${chosen.length} built from the diagram`;
  });
}

/**
 * Swaps a paper's questions for a new set: the new rows go in FIRST, and the
 * old ones are removed only once they are there. Deleting first meant that an
 * insert refused by the database left a published paper with no questions at
 * all, while the form reported the failure as if nothing had changed.
 */
async function replaceQuestions(
  paperId: string,
  rows: Record<string, unknown>[],
): Promise<{ inserted: number; error: string | null }> {
  const store = questionStore();

  const { data: old } = await store
    .from("watch_questions")
    .select("id")
    .eq("paper_id", paperId);
  const oldIds = (old ?? []).map((q) => q.id as string);

  const { data: inserted, error } = await store
    .from("watch_questions")
    .insert(rows)
    .select("id");
  if (error) return { inserted: 0, error: error.message };

  // Reading the rows back proves they are really there. Without this the
  // action reported success whenever the database merely declined quietly —
  // which is exactly how "saved" appeared over an empty paper.
  if ((inserted?.length ?? 0) !== rows.length) {
    return {
      inserted: inserted?.length ?? 0,
      error:
        `${rows.length} question(s) were sent but ${inserted?.length ?? 0} were stored. ` +
        `The database accepted the request without saving, which usually means your ` +
        `account is not an admin there. Check the role on your row in the profiles table.`,
    };
  }

  if (oldIds.length) {
    const { error: deleteError } = await store.from("watch_questions").delete().in("id", oldIds);
    if (deleteError) {
      return {
        inserted: inserted?.length ?? 0,
        error: `The new questions are in, but the old ones could not be removed: ${deleteError.message}`,
      };
    }
  }

  return { inserted: inserted?.length ?? 0, error: null };
}

/**
 * Replaces the paper's questions with an uploaded set.
 *
 * Nothing is deleted until the whole batch has parsed, so a typo on line 30
 * cannot leave the paper half-empty.
 */
export async function importQuestions(
  _prev: SaveState | null,
  formData: FormData,
): Promise<SaveState> {
  const slug = String(formData.get("slug"));
  return attempt("Questions", async () => {
    await requireEditor();
    const supabase = await createClient();

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
      // After the LAST position, not after the count: a deleted question
      // leaves a gap, and a count would hand the newcomer a number already
      // in use, leaving two questions to swap places between loads.
      const { data: last } = await questionStore()
        .from("watch_questions")
        .select("position")
        .eq("paper_id", paper.id)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();
      offset = last ? Number(last.position) + 1 : 0;
    }

    const rows = parsed.map((q, i) => ({
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
    }));

    if (!append) {
      const { inserted, error } = await replaceQuestions(paper.id, rows);
      revalidatePath(`/admin/watch-table/${slug}`);
      paperChanged(slug);
      if (error) throw new Error(error);
      return `${inserted} questions`;
    }

    const { data: inserted, error } = await questionStore()
      .from("watch_questions")
      .insert(rows)
      .select("id");

    if (error) throw new Error(error.message);
    if ((inserted?.length ?? 0) !== parsed.length) {
      throw new Error(
        `${parsed.length} question(s) were sent but ${inserted?.length ?? 0} were stored. ` +
          `The database accepted the request without saving, which usually means your ` +
          `account is not an admin there. Check the role on your row in the profiles table.`,
      );
    }
    revalidatePath(`/admin/watch-table/${slug}`);
    paperChanged(slug);
    return `${inserted.length} questions added`;
  });
}

export async function deleteQuestion(
  _prev: SaveState | null,
  formData: FormData,
): Promise<SaveState> {
  const slug = String(formData.get("slug"));
  return attempt("Question", async () => {
    await requireEditor();

    const { data: gone, error } = await questionStore()
      .from("watch_questions")
      .delete()
      .eq("id", String(formData.get("id")))
      .select("id");

    if (error) throw new Error(error.message);
    if (!gone?.length) throw new Error("That question is already gone");
    revalidatePath(`/admin/watch-table/${slug}`);
    paperChanged(slug);
    return "deleted";
  });
}

export async function saveQuestion(
  _prev: SaveState | null,
  formData: FormData,
): Promise<SaveState> {
  const slug = String(formData.get("slug"));
  return attempt("Question", async () => {
    await requireEditor();

    const topic = String(formData.get("topic") ?? "").trim().slice(0, 60);
    const promptEn = String(formData.get("prompt_en") ?? "").trim();
    if (!promptEn) throw new Error("The English question cannot be blank");

    // The same rules the upload applies, so the two ways of editing agree:
    // every option a whole number, no two the same, between two and ten.
    const tokens = String(formData.get("options") ?? "")
      .split(/[,\s]+/)
      .filter(Boolean);
    const options = tokens.map((v) => Number(v));
    const bad = tokens.find(
      (v, i) => !Number.isInteger(options[i]) || Math.abs(options[i]) >= MAX_OPTION,
    );
    if (bad !== undefined) throw new Error(`"${bad}" is not a whole number below a million`);
    if (options.length < 2) throw new Error("A question needs at least two options");
    if (options.length > 10) throw new Error("A question can offer at most ten options");
    if (new Set(options).size !== options.length) {
      throw new Error("The same number appears twice among the options");
    }

    const answer = Number(formData.get("answer"));
    if (!options.includes(answer)) {
      throw new Error(`The answer ${answer} is not one of the options ${options.join(", ")}`);
    }

    const { data: updated, error } = await questionStore()
      .from("watch_questions")
      .update({
        prompt_en: promptEn,
        prompt_hi: String(formData.get("prompt_hi") ?? "").trim(),
        options,
        answer,
        topic,
      })
      .eq("id", String(formData.get("id")))
      .select("id");

    if (error) throw new Error(error.message);
    if (!updated?.length) throw new Error("That question no longer exists");
    revalidatePath(`/admin/watch-table/${slug}`);
    paperChanged(slug);
  });
}

export async function deletePaper(formData: FormData) {
  const slug = String(formData.get("slug"));
  return run(`/admin/watch-table/${slug}`, "Delete", async () => {
    await requireAdmin();
    const supabase = await createClient();

    // Questions, attempts and sittings go with it via ON DELETE CASCADE.
    const { data: gone, error } = await supabase
      .from("watch_papers")
      .delete()
      .eq("slug", slug)
      .select("display_name");

    if (error) throw new Error(error.message);
    if (!gone?.length) throw new Error(NOTHING_CHANGED);
    paperChanged(slug);
    redirect(
      `/admin/watch-table?saved=${encodeURIComponent(`Deleted — ${gone[0].display_name}, with its questions and results`)}`,
    );
  });
}

/**
 * Replaces the instruction screen's wording and its worked example.
 *
 * Both are stored as bilingual paragraphs, so the English and Hindi columns
 * can never drift out of step: a paragraph exists in both languages or in
 * neither.
 */
export async function saveInstructions(
  _prev: SaveState | null,
  formData: FormData,
): Promise<SaveState> {
  const slug = String(formData.get("slug"));
  return attempt("Instructions", async () => {
    await requireEditor();
    const supabase = await createClient();

      const instructions = parseInstructionLines(String(formData.get("instructions") ?? ""));
    const exampleText = parseInstructionLines(String(formData.get("example_text") ?? ""));

    if (instructions.length === 0) {
      throw new Error("The instruction screen cannot be left blank");
    }

    const { data: updated, error } = await supabase
      .from("watch_papers")
      .update({
        instructions,
        example_text: exampleText,
        updated_at: new Date().toISOString(),
      })
      .eq("slug", slug)
      .select("id");

    if (error) throw new Error(error.message);
    if (!updated?.length) throw new Error(NOTHING_CHANGED);
    revalidatePath(`/admin/watch-table/${slug}`);
    paperChanged(slug);  });
}

/**
 * Copies a paper, with its diagram, wording, settings and every question.
 *
 * Building Test 2 from Test 1 otherwise means retyping all of it. The copy
 * arrives UNPUBLISHED whatever the original was, so a half-edited duplicate
 * cannot appear on the students' dashboard while it is still being worked on.
 */
export async function duplicatePaper(formData: FormData) {
  const slug = String(formData.get("slug"));
  // The body redirects to the new paper on success; run() lets a
  // redirect through and only catches real failures.
  return run(`/admin/watch-table/${slug}`, "Copy", async () => {
    await requireEditor();
    const supabase = await createClient();

  
    const { data: source, error: readErr } = await supabase
      .from("watch_papers")
      .select("*")
      .eq("slug", slug)
      .single();

    if (readErr || !source) throw new Error(readErr?.message ?? "Paper not found");

    // Everything except the row's own identity and its published state.
    const {
      id: _id,
      slug: _slug,
      created_at: _createdAt,
      updated_at: _updatedAt,
      is_published: _published,
      display_name: sourceName,
      ...rest
    } = source as Record<string, unknown> & { display_name: string };

    const displayName = String(formData.get("display_name") ?? "").trim() ||
      `${sourceName} (copy)`;

    // A slug collides the moment you copy the same paper twice, so give it
    // something unique rather than letting the insert fail.
    const newSlug = `${slugify(displayName)}-${Date.now().toString(36).slice(-4)}`;

    const { data: copy, error: insErr } = await supabase
      .from("watch_papers")
      .insert({ ...rest, slug: newSlug, display_name: displayName, is_published: false })
      .select("id, slug")
      .single();

    if (insErr || !copy) throw new Error(insErr?.message ?? "Could not create the copy");

    const { data: questions, error: qErr } = await questionStore()
      .from("watch_questions")
      .select("position, prompt_en, prompt_hi, options, answer, working_en, working_hi, topic")
      .eq("paper_id", source.id)
      .order("position");

    if (qErr) throw new Error(qErr.message);

    if (questions?.length) {
      const { error: copyErr } = await questionStore()
        .from("watch_questions")
        .insert(questions.map((q) => ({ ...q, paper_id: copy.id })));

      // A paper whose questions failed to copy is worse than no copy at all:
      // it looks complete in the list and turns out empty when opened.
      if (copyErr) {
        await supabase.from("watch_papers").delete().eq("id", copy.id);
        throw new Error(`The questions could not be copied: ${copyErr.message}`);
      }
    }

    paperChanged(copy.slug);
    redirect(`/admin/watch-table/${copy.slug}`);  });
}
