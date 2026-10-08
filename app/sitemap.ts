import type { MetadataRoute } from "next";
import { listPublishedPosts } from "@/lib/blog";
import { TEST_PAGES } from "@/lib/seo-tests";

/** The public pages and every published article; everything behind the login stays out. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const posts = await listPublishedPosts();
  return [
    { url: "https://kautilyaonline.com/", lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: "https://kautilyaonline.com/packages", lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: "https://kautilyaonline.com/signup", lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: "https://kautilyaonline.com/rrb-alp-psycho-test", lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: "https://kautilyaonline.com/demo", lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    ...TEST_PAGES.map((t) => ({ url: `https://kautilyaonline.com/psycho-test/${t.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 })),
    { url: "https://kautilyaonline.com/blog", lastModified: posts[0] ? new Date(posts[0].updatedAt) : now, changeFrequency: "weekly", priority: 0.8 },
    ...posts.map((p) => ({ url: `https://kautilyaonline.com/blog/${p.slug}`, lastModified: new Date(p.updatedAt), changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
