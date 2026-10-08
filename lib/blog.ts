import { revalidateTag, unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Package } from "@/lib/packages";

/**
 * Articles written in the panel for search engines. Each names the
 * packages shown beside it, in order, and may push one of them.
 */
export interface PostFaq {
  q: string;
  a: string;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  exam: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  packageSlugs: string[];
  upsellSlug: string | null;
  faq: PostFaq[];
  isPublished: boolean;
  publishedAt: string | null;
  author: string;
  createdAt: string;
  updatedAt: string;
}

/** What the index and the related list need: no content. */
export type PostSummary = Pick<Post, "id" | "slug" | "title" | "excerpt" | "coverImageUrl" | "exam" | "publishedAt" | "isPublished" | "updatedAt">;

const TAG = "blog";

export function blogChanged(): void {
  revalidateTag(TAG);
}

interface PostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content?: string | null;
  cover_image_url: string | null;
  exam: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  keywords?: string | null;
  package_slugs?: string[] | null;
  upsell_slug?: string | null;
  faq?: unknown;
  is_published: boolean;
  published_at: string | null;
  author?: string | null;
  created_at: string;
  updated_at: string;
}

const COLUMNS =
  "id, slug, title, excerpt, content, cover_image_url, exam, meta_title, meta_description, keywords, package_slugs, upsell_slug, faq, is_published, published_at, author, created_at, updated_at";
const SUMMARY_COLUMNS = "id, slug, title, excerpt, cover_image_url, exam, is_published, published_at, updated_at, created_at";

function faqOf(raw: unknown): PostFaq[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((f) => (f && typeof f === "object" ? { q: String((f as PostFaq).q ?? "").trim(), a: String((f as PostFaq).a ?? "").trim() } : null))
    .filter((f): f is PostFaq => Boolean(f && f.q && f.a));
}

function toPost(r: PostRow): Post {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt ?? "",
    content: r.content ?? "",
    coverImageUrl: r.cover_image_url,
    exam: r.exam ?? "alp",
    metaTitle: r.meta_title ?? "",
    metaDescription: r.meta_description ?? "",
    keywords: r.keywords ?? "",
    packageSlugs: r.package_slugs ?? [],
    upsellSlug: r.upsell_slug ?? null,
    faq: faqOf(r.faq),
    isPublished: r.is_published,
    publishedAt: r.published_at,
    author: r.author ?? "Kautilya Classes",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toSummary(r: PostRow): PostSummary {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt ?? "",
    coverImageUrl: r.cover_image_url,
    exam: r.exam ?? "alp",
    publishedAt: r.published_at,
    isPublished: r.is_published,
    updatedAt: r.updated_at,
  };
}

/** The published articles, newest first, from the shared cache; empty before the SQL has run. */
export async function listPublishedPosts(): Promise<PostSummary[]> {
  return unstable_cache(
    async () => {
      try {
        const { data, error } = await createAdminClient()
          .from("blog_posts")
          .select(SUMMARY_COLUMNS)
          .eq("is_published", true)
          .order("published_at", { ascending: false, nullsFirst: false });
        if (error) return [];
        return (data as PostRow[]).map(toSummary);
      } catch {
        return [];
      }
    },
    ["published-posts"],
    { tags: [TAG], revalidate: 300 },
  )();
}

/** One published article, from the shared cache. */
export async function loadPublishedPost(slug: string): Promise<Post | null> {
  return unstable_cache(
    async () => {
      try {
        const { data, error } = await createAdminClient().from("blog_posts").select(COLUMNS).eq("slug", slug).eq("is_published", true).maybeSingle();
        if (error || !data) return null;
        return toPost(data as PostRow);
      } catch {
        return null;
      }
    },
    ["post", slug],
    { tags: [TAG], revalidate: 300 },
  )();
}

/** Every article, for the panel. */
export async function listPostsForAdmin(): Promise<PostSummary[]> {
  const { data, error } = await createAdminClient().from("blog_posts").select(SUMMARY_COLUMNS).order("updated_at", { ascending: false });
  if (error) return [];
  return (data as PostRow[]).map(toSummary);
}

/** One article as it is right now, draft or not, for the panel and its preview. */
export async function loadPostLive(slug: string): Promise<Post | null> {
  const { data, error } = await createAdminClient().from("blog_posts").select(COLUMNS).eq("slug", slug).maybeSingle();
  if (error || !data) return null;
  return toPost(data as PostRow);
}

/** A reading-time figure, for the byline. */
export function readingMinutes(content: string): number {
  const words = content.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Q and A pairs typed as lines "Q: ..." / "A: ..." in the panel. */
export function parseFaq(text: string): PostFaq[] {
  const out: PostFaq[] = [];
  let q: string | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (/^q\s*:/i.test(line)) q = line.replace(/^q\s*:\s*/i, "");
    else if (/^a\s*:/i.test(line) && q) {
      out.push({ q, a: line.replace(/^a\s*:\s*/i, "") });
      q = null;
    }
  }
  return out;
}

export function faqToText(faq: PostFaq[]): string {
  return faq.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n");
}

/** The packages the article names, in its order, with the pushed one first. */
export function sidebarPackages(post: Post, all: Package[]): { packages: Package[]; upsell: Package | null; saving: number | null } {
  const bySlug = new Map(all.map((p) => [p.slug, p]));
  const chosen = post.packageSlugs.map((s) => bySlug.get(s)).filter((p): p is Package => Boolean(p));
  const upsell = post.upsellSlug ? (bySlug.get(post.upsellSlug) ?? null) : null;
  const ordered = upsell ? [upsell, ...chosen.filter((p) => p.id !== upsell.id)] : chosen;
  let saving: number | null = null;
  if (upsell?.kind === "combo") {
    const parts = all.filter((p) => p.exam === upsell.exam && p.isPublished && (p.kind === "sectional" || p.kind === "full"));
    const sectional = parts.find((p) => p.kind === "sectional");
    const full = parts.find((p) => p.kind === "full");
    if (sectional && full) saving = sectional.priceInr + full.priceInr - upsell.priceInr;
  }
  return { packages: ordered, upsell, saving };
}
