import type { MetadataRoute } from "next";

/** The public pages only; everything behind the login stays out. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: "https://kautilyaonline.com/", lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: "https://kautilyaonline.com/packages", lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: "https://kautilyaonline.com/signup", lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];
}
