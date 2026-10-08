import type { MetadataRoute } from "next";

/** The front page is for search engines; the portal behind the login is not. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/signup", "/packages", "/blog", "/terms", "/privacy", "/refund-policy"],
      disallow: ["/admin", "/staff", "/dashboard", "/test", "/tests", "/mock", "/mocks", "/practice", "/results", "/profile", "/api", "/auth"],
    },
    sitemap: "https://kautilyaonline.com/sitemap.xml",
  };
}
