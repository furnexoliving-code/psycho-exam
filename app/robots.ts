import type { MetadataRoute } from "next";

/** A private portal: nothing in it is for search engines. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
