import type { Metadata } from "next";
import { GuideView } from "@/components/seo/GuideView";
import { listPackages } from "@/lib/packages";
import { GUIDE, SITE } from "@/lib/seo/content";
import { JsonLd, articleLd, breadcrumbLd, faqLd } from "@/lib/seo/jsonld";

export const revalidate = 3600;

const URL = `${SITE}/rrb-alp-psycho-test`;

export const metadata: Metadata = {
  title: GUIDE.title,
  description: GUIDE.description,
  keywords: GUIDE.keywords,
  robots: { index: true, follow: true },
  alternates: { canonical: URL },
  openGraph: { type: "article", url: URL, title: GUIDE.title, description: GUIDE.description, locale: "en_IN", siteName: "Kautilya Classes · Railway Psycho Test Portal" },
  twitter: { card: "summary_large_image", title: GUIDE.title, description: GUIDE.description },
};

export default async function AlpGuidePage() {
  const packages = await listPackages("alp");
  return (
    <>
      <JsonLd data={[
        articleLd(URL, GUIDE.title, GUIDE.description, "RRB ALP Computer Based Aptitude Test (CBAT)"),
        breadcrumbLd([{ name: "Home", url: `${SITE}/` }, { name: "RRB ALP Psycho Test", url: URL }]),
        faqLd(GUIDE.faq),
      ]} />
      <GuideView page={GUIDE} packages={packages} />
    </>
  );
}
