import type { Metadata } from "next";
import { HubView } from "@/components/seo/HubView";
import { listPackages } from "@/lib/packages";
import { KIND_PAGES, SITE, kindUrl } from "@/lib/seo/content";
import { JsonLd, breadcrumbLd, collectionLd } from "@/lib/seo/jsonld";

export const revalidate = 3600;

const TITLE = "All 19 Kinds of Question in the RRB ALP Psycho Test";
const DESCRIPTION = "Every kind of question the RRB ALP CBAT can give, test by test: the hall's count and clock, a worked example, the method, tips and a 7-day plan for each.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["rrb alp psycho test questions", "alp cbat question types", "alp psycho test me kya aata hai", "railway psycho test ke prakar", "alp aptitude test pattern", "psycho test 19 types"],
  robots: { index: true, follow: true },
  alternates: { canonical: `${SITE}/psycho-test` },
  openGraph: { type: "website", url: `${SITE}/psycho-test`, title: TITLE, description: DESCRIPTION, locale: "en_IN", siteName: "Kautilya Classes · Railway Psycho Test Portal" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default async function HubPage() {
  const packages = await listPackages("alp");
  return (
    <>
      <JsonLd data={[
        collectionLd(`${SITE}/psycho-test`, TITLE, DESCRIPTION, KIND_PAGES.map((k) => ({ name: `${k.code} ${k.name}`, url: `${SITE}${kindUrl(k)}` }))),
        breadcrumbLd([{ name: "Home", url: `${SITE}/` }, { name: "RRB ALP Psycho Test", url: `${SITE}/rrb-alp-psycho-test` }, { name: "All 19 kinds of question", url: `${SITE}/psycho-test` }]),
      ]} />
      <HubView packages={packages} />
    </>
  );
}
