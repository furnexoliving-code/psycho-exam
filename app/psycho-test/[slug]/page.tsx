import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TestPageView } from "@/components/seo/TestPageView";
import { listPackages } from "@/lib/packages";
import { TEST_PAGES, testPage } from "@/lib/seo-tests";
import { DEVICE_FAQ } from "@/lib/seo-sections";

const SITE = "https://kautilyaonline.com";

export const revalidate = 3600;

export function generateStaticParams() {
  return TEST_PAGES.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = testPage(slug);
  if (!page) return { robots: { index: false, follow: false } };
  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    robots: { index: true, follow: true },
    alternates: { canonical: `${SITE}/psycho-test/${page.slug}` },
    openGraph: { type: "article", url: `${SITE}/psycho-test/${page.slug}`, title: page.title, description: page.description, images: [{ url: "/og.jpg" }], locale: "en_IN" },
  };
}

export default async function TestSeoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = testPage(slug);
  if (!page) notFound();
  const packages = await listPackages("alp");
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: page.title,
      description: page.description,
      author: { "@type": "Organization", name: "Kautilya Classes" },
      publisher: { "@type": "Organization", name: "Kautilya Classes", logo: { "@type": "ImageObject", url: `${SITE}/kautilya-logo.png` } },
      mainEntityOfPage: `${SITE}/psycho-test/${page.slug}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "RRB ALP Psycho Test", item: `${SITE}/rrb-alp-psycho-test` },
        { "@type": "ListItem", position: 3, name: page.name, item: `${SITE}/psycho-test/${page.slug}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [...page.faq, DEVICE_FAQ].map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TestPageView page={page} packages={packages} />
    </>
  );
}
