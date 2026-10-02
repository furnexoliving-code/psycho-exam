"use server";

import { revalidatePath } from "next/cache";
import { attempt, type SaveState } from "@/lib/admin-result";
import { requireEditor } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { paperChanged } from "@/lib/wt/db";
import { FIGURE_BATCH, MAX_OPTION_COUNT, OPTION_LETTERS } from "@/lib/wt/figure-sample";

/**
 * The Perceptual Speed paper's questions: pictures, each answered by a
 * letter. Kept apart from the Following Directions actions, which are not
 * touched by this test; both check the editor role and work through the
 * service-role question store, since the answer column is revoked from
 * every signed-in user.
 */

const questionStore = createAdminClient;


function pictureLink(url: string): string {
  const text = url.trim();
  if (!/^https:\/\/\S+$/i.test(text) || text.length > 2000) {
    throw new Error("A picture must be an https link");
  }
  return text;
}

/** The paper's row id, through the editor's own session so the policy applies. */
async function paperIdOf(slug: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.from("watch_papers").select("id").eq("slug", slug).maybeSingle();
  if (!data) throw new Error("That paper no longer exists");
  return data.id as string;
}

async function questionOf(id: string, paperId: string) {
  const { data } = await questionStore()
    .from("watch_questions")
    .select("id, options, option_images")
    .eq("id", id)
    .eq("paper_id", paperId)
    .maybeSingle();
  if (!data) throw new Error("That question no longer exists");
  return data as { id: string; options: string[]; option_images: string[] | null };
}

/**
 * Appends one question per picture, in the order given, with no answer yet.
 *
 * The answer is "" until the admin sets it — never a guessed letter, which
 * would mark a whole batch against a key nobody chose. A paper cannot be
 * published while a question is still unanswered.
 */
export async function addFigureQuestions(
  slug: string,
  /** One entry per question: its figure, and a picture per option when the options are pictures. */
  items: (string | { image: string; options?: string[] })[],
  optionCount: number,
): Promise<{ added: number; error?: string }> {
  try {
    await requireEditor();
    if (!Array.isArray(items) || items.length === 0) throw new Error("No pictures were given");
    if (items.length > FIGURE_BATCH) throw new Error(`At most ${FIGURE_BATCH} questions in one batch`);
    const count = Math.floor(Number(optionCount));
    if (!Number.isInteger(count) || count < 2 || count > MAX_OPTION_COUNT) {
      throw new Error(`Options per question must be from 2 to ${MAX_OPTION_COUNT}`);
    }
    const links = items.map((item, i) => {
      const image = pictureLink(typeof item === "string" ? item : item.image);
      const options = typeof item === "string" ? undefined : item.options;
      if (options !== undefined) {
        if (!Array.isArray(options) || options.length !== count) {
          throw new Error(`Question ${i + 1}: needs exactly ${count} option pictures`);
        }
        return { image, options: options.map(pictureLink) };
      }
      return { image, options: null };
    });
    const paperId = await paperIdOf(slug);

    const { data: last } = await questionStore()
      .from("watch_questions")
      .select("position")
      .eq("paper_id", paperId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const start = ((last?.position as number | undefined) ?? -1) + 1;

    const { error } = await questionStore().from("watch_questions").insert(
      links.map((q, i) => ({
        paper_id: paperId,
        position: start + i,
        prompt_en: "",
        prompt_hi: "",
        options: OPTION_LETTERS.slice(0, count),
        answer: "",
        image_url: q.image,
        option_images: q.options,
      })),
    );
    if (error) throw new Error(error.message);

    revalidatePath(`/admin/watch-table/${slug}`);
    paperChanged(slug);
    return { added: links.length };
  } catch (error) {
    if (typeof (error as { digest?: unknown })?.digest === "string") throw error;
    return { added: 0, error: error instanceof Error ? error.message : String(error) };
  }
}

/** Sets one question's answer to one of its letters. */
export async function setFigureAnswer(
  _prev: SaveState | null,
  formData: FormData,
): Promise<SaveState> {
  const slug = String(formData.get("slug"));
  return attempt("Answer", async () => {
    await requireEditor();
    const paperId = await paperIdOf(slug);
    const q = await questionOf(String(formData.get("id")), paperId);
    const answer = String(formData.get("answer") ?? "").trim().toUpperCase();
    if (!q.options.includes(answer)) {
      throw new Error(`The answer must be one of ${q.options.join(", ")}`);
    }
    const { error } = await questionStore()
      .from("watch_questions")
      .update({ answer })
      .eq("id", q.id);
    if (error) throw new Error(error.message);
    revalidatePath(`/admin/watch-table/${slug}`);
    paperChanged(slug);
    return `set to ${answer}`;
  });
}

/**
 * Sets every question's answer from one typed key, in question order:
 * "ABDCE…" or "A B D C E" or "A,B,D,C,E". Checked whole before any is
 * written, so a key with a stray letter changes nothing.
 */
export async function applyAnswerKey(
  _prev: SaveState | null,
  formData: FormData,
): Promise<SaveState> {
  const slug = String(formData.get("slug"));
  return attempt("Answer key", async () => {
    await requireEditor();
    const paperId = await paperIdOf(slug);
    const letters = String(formData.get("key") ?? "")
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .split("");
    if (letters.length === 0) throw new Error("Type the answers, one letter per question, in order");

    const { data: rows } = await questionStore()
      .from("watch_questions")
      .select("id, position, options")
      .eq("paper_id", paperId)
      .order("position");
    const questions = (rows ?? []) as { id: string; position: number; options: string[] }[];
    if (questions.length === 0) throw new Error("There are no questions yet");
    if (letters.length !== questions.length) {
      throw new Error(
        `The key has ${letters.length} letter${letters.length === 1 ? "" : "s"} but the paper has ${questions.length} question${questions.length === 1 ? "" : "s"}. Give exactly one letter per question, in order.`,
      );
    }
    questions.forEach((q, i) => {
      if (!q.options.includes(letters[i])) {
        throw new Error(`Question ${i + 1}: "${letters[i]}" is not one of its options ${q.options.join(", ")}`);
      }
    });

    for (let i = 0; i < questions.length; i++) {
      const { error } = await questionStore()
        .from("watch_questions")
        .update({ answer: letters[i] })
        .eq("id", questions[i].id);
      if (error) throw new Error(`Question ${i + 1}: ${error.message}`);
    }

    revalidatePath(`/admin/watch-table/${slug}`);
    paperChanged(slug);
    return `${questions.length} answers set`;
  });
}

/** Gives one question a picture per option, in option order, or takes them away. */
export async function setOptionImages(
  slug: string,
  id: string,
  urls: string[] | null,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireEditor();
    const paperId = await paperIdOf(slug);
    const q = await questionOf(id, paperId);
    let images: string[] | null = null;
    if (urls) {
      if (urls.length !== q.options.length) {
        throw new Error(`This question has ${q.options.length} options, so choose exactly ${q.options.length} pictures, named in option order`);
      }
      images = urls.map(pictureLink);
    }
    const { error } = await questionStore()
      .from("watch_questions")
      .update({ option_images: images })
      .eq("id", q.id);
    if (error) throw new Error(error.message);
    revalidatePath(`/admin/watch-table/${slug}`);
    paperChanged(slug);
    return { ok: true };
  } catch (error) {
    if (typeof (error as { digest?: unknown })?.digest === "string") throw error;
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** Swaps the figure of one question for another picture. */
export async function replaceFigureImage(
  slug: string,
  id: string,
  url: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireEditor();
    const paperId = await paperIdOf(slug);
    const q = await questionOf(id, paperId);
    const { error } = await questionStore()
      .from("watch_questions")
      .update({ image_url: pictureLink(url) })
      .eq("id", q.id);
    if (error) throw new Error(error.message);
    revalidatePath(`/admin/watch-table/${slug}`);
    paperChanged(slug);
    return { ok: true };
  } catch (error) {
    if (typeof (error as { digest?: unknown })?.digest === "string") throw error;
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
