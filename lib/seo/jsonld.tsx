import { CONTENT_PUBLISHED, CONTENT_UPDATED, SITE, type Faq } from "@/lib/seo/content";

/** The structured data the public pages carry, in schema.org's shape. */
const publisher = { "@type": "Organization", name: "Kautilya Classes", url: `${SITE}/`, logo: { "@type": "ImageObject", url: `${SITE}/kautilya-logo.png` } };

export function articleLd(url: string, headline: string, description: string, about?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    inLanguage: "en-IN",
    datePublished: CONTENT_PUBLISHED,
    dateModified: CONTENT_UPDATED,
    author: { "@type": "Organization", name: "Kautilya Classes", url: `${SITE}/` },
    publisher,
    mainEntityOfPage: url,
    image: `${url}/opengraph-image`,
    ...(about ? { about: { "@type": "Thing", name: about } } : {}),
  };
}

export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
  };
}

export function faqLd(faq: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function collectionLd(url: string, name: string, description: string, items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url,
    inLanguage: "en-IN",
    dateModified: CONTENT_UPDATED,
    publisher,
    mainEntity: { "@type": "ItemList", itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, url: it.url })) },
  };
}

/** One <script> for a page's structured data. */
export function JsonLd({ data }: { data: object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
