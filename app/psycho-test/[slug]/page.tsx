import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BatteryPageView } from "@/components/seo/BatteryPageView";
import { listPackages } from "@/lib/packages";
import { BATTERY_PAGES, SITE, STANDARD_FAQ, batteryPage } from "@/lib/seo/content";
import { JsonLd, articleLd, breadcrumbLd, faqLd } from "@/lib/seo/jsonld";

export const revalidate = 3600;

export function generateStaticParams() {
  return BATTERY_PAGES.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = batteryPage(slug);
  if (!page) return { robots: { index: false, follow: false } };
  const url = `${SITE}/psycho-test/${page.slug}`;
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

export default async function BatterySeoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = batteryPage(slug);
  if (!page) notFound();
  const packages = await listPackages("alp");
  const url = `${SITE}/psycho-test/${page.slug}`;
  return (
    <>
      <JsonLd data={[
        articleLd(url, page.title, page.description, `${page.name} (RRB ALP CBAT, Test ${page.battery})`),
        breadcrumbLd([{ name: "Home", url: `${SITE}/` }, { name: "RRB ALP Psycho Test", url: `${SITE}/rrb-alp-psycho-test` }, { name: page.name, url }]),
        faqLd([...page.faq, ...STANDARD_FAQ]),
      ]} />
      <BatteryPageView page={page} packages={packages} />
    </>
  );
}
