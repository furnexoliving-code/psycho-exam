"use server";

import { revalidatePath } from "next/cache";
import { attempt, type SaveState } from "@/lib/admin-result";
import { requireEditor } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { paperChanged } from "@/lib/wt/db";
import {
  FIGURE_BATCH,
  MAX_NUMBER_OPTIONS,
  MAX_OPTION_COUNT,
  optionValues,
  type OptionStyle,
} from "@/lib/wt/figure-sample";
import { parseOption } from "@/lib/wt/parse-questions";

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
  return data as { id: string; options: (string | number)[]; option_images: string[] | null };
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
  /**
   * One entry per question: its figure, and a picture per option when the
   * options are pictures. A question may also be its option pictures alone
   * (the Memory Test, whose figure was memorised).
   */
  items: (string | { image?: string | null; options?: string[] })[],
  optionCount: number,
  optionStyle: OptionStyle = "letters",
): Promise<{ added: number; error?: string }> {
  try {
    await requireEditor();
    if (!Array.isArray(items) || items.length === 0) throw new Error("No pictures were given");
    if (items.length > FIGURE_BATCH) throw new Error(`At most ${FIGURE_BATCH} questions in one batch`);
    const style: OptionStyle = optionStyle === "numbers" ? "numbers" : "letters";
    const count = Math.floor(Number(optionCount));
    const most = style === "numbers" ? MAX_NUMBER_OPTIONS : MAX_OPTION_COUNT;
    if (!Number.isInteger(count) || count < 2 || count > most) {
      throw new Error(`Options per question must be from 2 to ${most}`);
    }
    const links = items.map((item, i) => {
      const rawImage = typeof item === "string" ? item : item.image;
      const image = rawImage ? pictureLink(rawImage) : null;
      const options = typeof item === "string" ? undefined : item.options;
      if (options !== undefined && options !== null) {
        if (!Array.isArray(options) || options.length !== count) {
          throw new Error(`Question ${i + 1}: needs exactly ${count} option pictures`);
        }
        return { image, options: options.map(pictureLink) };
      }
      if (!image) throw new Error(`Question ${i + 1}: has neither a figure nor option pictures`);
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
        options: optionValues(style, count),
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
    const raw = String(formData.get("answer") ?? "").trim();
    if (!raw) throw new Error("Choose an answer");
    const answer = parseOption(raw);
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
    const text = String(formData.get("key") ?? "").trim();
    if (!text) throw new Error("Type the answers, one per question, in order");

    const { data: rows } = await questionStore()
      .from("watch_questions")
      .select("id, position, options")
      .eq("paper_id", paperId)
      .order("position");
    const questions = (rows ?? []) as { id: string; position: number; options: (string | number)[] }[];
    if (questions.length === 0) throw new Error("There are no questions yet");

    // Letters may be run together (ABDCE); numbers need a space or comma
    // between them, since "10" is one answer and not two. A single run of
    // letters with no separators is split into its characters.
    let tokens = text.split(/[\s,;|]+/).filter(Boolean);
    if (tokens.length === 1 && questions.length > 1 && /^[A-Za-z]+$/.test(tokens[0])) {
      tokens = tokens[0].split("");
    }
    if (tokens.length !== questions.length) {
      throw new Error(
        `The key has ${tokens.length} answer${tokens.length === 1 ? "" : "s"} but the paper has ${questions.length} question${questions.length === 1 ? "" : "s"}. Give exactly one per question, in order (numbers separated by spaces or commas).`,
      );
    }
    const answers = tokens.map((token, i) => {
      let value;
      try {
        value = parseOption(token);
      } catch {
        throw new Error(`Question ${i + 1}: "${token}" is not an answer`);
      }
      if (!questions[i].options.includes(value)) {
        throw new Error(`Question ${i + 1}: "${token}" is not one of its options ${questions[i].options.join(", ")}`);
      }
      return value;
    });

    for (let i = 0; i < questions.length; i++) {
      const { error } = await questionStore()
        .from("watch_questions")
        .update({ answer: answers[i] })
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

/**
 * The Memory Test's study screens: one picture per part, in part order,
 * shown for the study time before that part's questions. An empty list
 * takes the study screens away.
 */
export async function setStudyImages(
  slug: string,
  urls: string[],
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireEditor();
    if (!Array.isArray(urls) || urls.length > 50) throw new Error("Give up to fifty pictures");
    const images = urls.map(pictureLink);
    const supabase = await createClient();
    const { data: row } = await supabase
      .from("watch_papers")
      .select("id, features")
      .eq("slug", slug)
      .maybeSingle();
    if (!row) throw new Error("That paper no longer exists");
    const features = { ...((row.features as Record<string, unknown>) ?? {}), studyImages: images };
    const { error } = await supabase
      .from("watch_papers")
      .update({ features, updated_at: new Date().toISOString() })
      .eq("id", row.id);
    if (error) throw new Error(error.message);
    revalidatePath(`/admin/watch-table/${slug}`);
    paperChanged(slug);
    return { ok: true };
  } catch (error) {
    if (typeof (error as { digest?: unknown })?.digest === "string") throw error;
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
