import type { MetadataRoute } from "next";
import { listPublishedPosts } from "@/lib/blog";
import { BATTERY_PAGES, CONTENT_UPDATED, KIND_PAGES, SITE, batteryUrl, kindUrl } from "@/lib/seo/content";
import { LAUNCH } from "@/lib/launch";

/**
 * The public pages and every published article; everything behind the
 * login stays out. The content pages carry the date their words were
 * last revised, not the time of the request: a sitemap that says
 * "changed today" every day is one search engines learn to ignore.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const revised = new Date(CONTENT_UPDATED);
  const posts = await listPublishedPosts();
  return [
    { url: `${SITE}/`, lastModified: revised, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/rrb-alp-psycho-test`, lastModified: revised, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE}/psycho-test`, lastModified: revised, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE}/packages`, lastModified: revised, changeFrequency: "weekly", priority: 0.9 },
    ...(LAUNCH.signup ? [{ url: `${SITE}/signup`, lastModified: revised, changeFrequency: "monthly" as const, priority: 0.8 }] : []),
    ...(LAUNCH.sampleTest ? [{ url: `${SITE}/demo`, lastModified: revised, changeFrequency: "monthly" as const, priority: 0.8 }] : []),
    ...BATTERY_PAGES.map((b) => ({ url: `${SITE}${batteryUrl(b)}`, lastModified: revised, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...KIND_PAGES.map((k) => ({ url: `${SITE}${kindUrl(k)}`, lastModified: revised, changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: `${SITE}/blog`, lastModified: posts[0] ? new Date(posts[0].updatedAt) : revised, changeFrequency: "weekly", priority: 0.8 },
    ...posts.map((p) => ({ url: `${SITE}/blog/${p.slug}`, lastModified: new Date(p.updatedAt), changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: `${SITE}/terms`, lastModified: revised, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/privacy`, lastModified: revised, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/refund-policy`, lastModified: revised, changeFrequency: "yearly", priority: 0.2 },
  ];
}
