import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionPageView } from "@/components/seo/SectionPageView";
import { listPackages } from "@/lib/packages";
import { SECTION_PAGES, batteryPageOf, sectionPage } from "@/lib/seo-sections";

const SITE = "https://kautilyaonline.com";

export const revalidate = 3600;

export function generateStaticParams() {
  return SECTION_PAGES.map((s) => ({ slug: batteryPageOf(s).slug, test: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; test: string }> }): Promise<Metadata> {
  const { slug, test } = await params;
  const page = sectionPage(slug, test);
  if (!page) return { robots: { index: false, follow: false } };
  const url = `${SITE}/psycho-test/${slug}/${page.slug}`;
  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    robots: { index: true, follow: true },
    alternates: { canonical: url },
    openGraph: { type: "article", url, title: page.title, description: page.description, images: [{ url: "/og.jpg" }], locale: "en_IN" },
  };
}

export default async function SectionSeoPage({ params }: { params: Promise<{ slug: string; test: string }> }) {
  const { slug, test } = await params;
  const page = sectionPage(slug, test);
  if (!page) notFound();
  const battery = batteryPageOf(page);
  const packages = await listPackages("alp");
  const url = `${SITE}/psycho-test/${battery.slug}/${page.slug}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: page.title,
      description: page.description,
      author: { "@type": "Organization", name: "Kautilya Classes" },
      publisher: { "@type": "Organization", name: "Kautilya Classes", logo: { "@type": "ImageObject", url: `${SITE}/kautilya-logo.png` } },
      mainEntityOfPage: url,
      about: { "@type": "Thing", name: `${page.name} (RRB ALP CBAT, Test ${page.battery} ${page.code})` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "RRB ALP Psycho Test", item: `${SITE}/rrb-alp-psycho-test` },
        { "@type": "ListItem", position: 3, name: battery.name, item: `${SITE}/psycho-test/${battery.slug}` },
        { "@type": "ListItem", position: 4, name: page.name, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SectionPageView page={page} packages={packages} />
    </>
  );
}
