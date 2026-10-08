"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { attempt, type SaveState } from "@/lib/admin-result";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/audit";
import { blogChanged, parseFaq } from "@/lib/blog";
import { EXAMS } from "@/lib/packages";

const BACK = "/admin/blog";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

/** Makes an empty draft and opens its editor. */
export async function createPost(formData: FormData): Promise<void> {
  await requireAdmin(BACK);
  const title = String(formData.get("title") ?? "").trim();
  if (!title) redirect(`${BACK}?error=${encodeURIComponent("Give the article a title")}`);
  const slug = slugify(String(formData.get("slug") ?? "") || title) || `article-${Date.now()}`;
  const { error } = await createAdminClient().from("blog_posts").insert({ slug, title, exam: "alp" });
  if (error) {
    const msg = /duplicate/i.test(error.message) ? `An article at /blog/${slug} already exists` : /blog_posts/i.test(error.message) ? "Run supabase/blog.sql first" : error.message;
    redirect(`${BACK}?error=${encodeURIComponent(msg)}`);
  }
  blogChanged();
  revalidatePath(BACK);
  await logAction("Article created", `${title} (${slug})`);
  redirect(`${BACK}/${slug}`);
}

/** Saves the article's text, search-engine fields, side packages and FAQ. */
export async function savePost(_prev: SaveState | null, formData: FormData): Promise<SaveState> {
  return attempt("Article", async () => {
    await requireAdmin();
    const slug = String(formData.get("slug") ?? "");
    const title = String(formData.get("title") ?? "").trim();
    if (!title) throw new Error("The title cannot be blank");
    const exam = String(formData.get("exam") ?? "alp");
    if (!EXAMS.some((e) => e.id === exam)) throw new Error("Unknown exam");
    const publish = formData.get("is_published") === "on";
    const content = String(formData.get("content") ?? "");
    if (publish && content.trim().length < 200) throw new Error("Write the article before publishing (at least a few paragraphs)");

    // The side packages, in the order typed: "1", "2", ... beside each package; blank = not shown.
    const order: { slug: string; pos: number }[] = [];
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith("pos_")) continue;
      const pos = Number(String(value).trim());
      if (Number.isInteger(pos) && pos > 0) order.push({ slug: key.slice(4), pos });
    }
    order.sort((a, b) => a.pos - b.pos);
    const packageSlugs = order.map((o) => o.slug);
    const upsellRaw = String(formData.get("upsell") ?? "").trim();
    const upsell = upsellRaw || null;

    const coverRaw = String(formData.get("cover_image_url") ?? "").trim();
    if (coverRaw && !/^https?:\/\//.test(coverRaw) && !coverRaw.startsWith("/")) throw new Error("The cover picture must be a web address (https://...)");

    const supabase = createAdminClient();
    const { data: before } = await supabase.from("blog_posts").select("published_at, is_published").eq("slug", slug).maybeSingle();
    if (!before) throw new Error("That article no longer exists");
    const publishedAt = publish ? ((before.published_at as string | null) ?? new Date().toISOString()) : (before.published_at as string | null);

    const { error } = await supabase
      .from("blog_posts")
      .update({
        title,
        excerpt: String(formData.get("excerpt") ?? "").trim(),
        content,
        cover_image_url: coverRaw || null,
        exam,
        meta_title: String(formData.get("meta_title") ?? "").trim(),
        meta_description: String(formData.get("meta_description") ?? "").trim(),
        keywords: String(formData.get("keywords") ?? "").trim(),
        package_slugs: packageSlugs,
        upsell_slug: upsell,
        faq: parseFaq(String(formData.get("faq") ?? "")),
        is_published: publish,
        published_at: publishedAt,
        author: String(formData.get("author") ?? "").trim() || "Kautilya Classes",
        updated_at: new Date().toISOString(),
      })
      .eq("slug", slug);
    if (error) throw new Error(error.message);
    blogChanged();
    revalidatePath(BACK);
    revalidatePath(`${BACK}/${slug}`);
    revalidatePath("/blog");
    revalidatePath(`/blog/${slug}`);
    revalidatePath("/sitemap.xml");
    await logAction(publish ? "Article published" : "Article saved (draft)", `${title} (${slug})`);
    return publish ? "published" : "saved as draft";
  });
}

export async function deletePost(_prev: SaveState | null, formData: FormData): Promise<SaveState> {
  return attempt("Article", async () => {
    await requireAdmin();
    const slug = String(formData.get("slug") ?? "");
    const { error } = await createAdminClient().from("blog_posts").delete().eq("slug", slug);
    if (error) throw new Error(error.message);
    blogChanged();
    revalidatePath(BACK);
    revalidatePath("/blog");
    await logAction("Article deleted", slug);
    redirect(BACK);
  });
}
