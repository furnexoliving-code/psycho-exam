import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KindPageView } from "@/components/seo/KindPageView";
import { listPackages } from "@/lib/packages";
import { KIND_PAGES, SITE, STANDARD_FAQ, batteryPageOf, kindPage, kindUrl } from "@/lib/seo/content";
import { JsonLd, articleLd, breadcrumbLd, faqLd } from "@/lib/seo/jsonld";

export const revalidate = 3600;

export function generateStaticParams() {
  return KIND_PAGES.map((k) => ({ slug: batteryPageOf(k.battery).slug, test: k.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; test: string }> }): Promise<Metadata> {
  const { slug, test } = await params;
  const page = kindPage(slug, test);
  if (!page) return { robots: { index: false, follow: false } };
  const url = `${SITE}${kindUrl(page)}`;
  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    robots: { index: true, follow: true },
    alternates: { canonical: url },
    openGraph: { type: "article", url, title: page.title, description: page.description, locale: "en_IN", siteName: "Kautilya Classes · Railway Psycho Test Portal" },
    twitter: { card: "summary_large_image", title: page.title, description: page.description },
  };
}

export default async function KindSeoPage({ params }: { params: Promise<{ slug: string; test: string }> }) {
  const { slug, test } = await params;
  const page = kindPage(slug, test);
  if (!page) notFound();
  const battery = batteryPageOf(page.battery);
  const packages = await listPackages("alp");
  const url = `${SITE}${kindUrl(page)}`;
  return (
    <>
      <JsonLd data={[
        articleLd(url, page.title, page.description, `${page.name} (RRB ALP CBAT, Test ${page.battery}, ${page.code})`),
        breadcrumbLd([
          { name: "Home", url: `${SITE}/` },
          { name: "RRB ALP Psycho Test", url: `${SITE}/rrb-alp-psycho-test` },
          { name: battery.name, url: `${SITE}/psycho-test/${battery.slug}` },
          { name: page.name, url },
        ]),
        faqLd([...page.faq, ...STANDARD_FAQ]),
      ]} />
      <KindPageView page={page} packages={packages} />
    </>
  );
}
