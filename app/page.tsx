import type { Metadata } from "next";
import { LandingPage, FAQ } from "@/components/landing/LandingPage";
import { listPackages } from "@/lib/packages";

/** Prices change rarely; the page is rebuilt every few minutes at most. */
export const revalidate = 300;

/**
 * The public front page, the one address search engines may index. A
 * signed-in student never sees it: the middleware sends them to the
 * dashboard before this renders.
 */
export const metadata: Metadata = {
  title: "RRB ALP Psycho Test (CBAT) Mock Practice as per RDSO Pattern | Kautilya Classes",
  description:
    "Practice the RRB ALP Computer Based Aptitude Test on a screen exactly like the exam hall: all 5 tests (Memory, Following Directions, Depth Perception, Power of Observation, Perceptual Speed), Full Mock Tests and instant T-Score. Hindi + English. By Kautilya Classes.",
  keywords: [
    "RRB ALP psycho test",
    "ALP CBAT mock test",
    "railway psycho test practice",
    "computer based aptitude test ALP",
    "RDSO psycho test pattern",
    "ALP psycho test online",
    "ASM psycho test",
    "Kautilya Classes",
  ],
  alternates: { canonical: "https://kautilyaonline.com/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "https://kautilyaonline.com/",
    siteName: "Kautilya Classes · Railway Psycho Test Portal",
    title: "RRB ALP Psycho Test (CBAT) practice, exactly like the exam hall",
    description: "All 5 tests of the CBAT, Full Mock Tests, instant T-Score. As per RDSO pattern, in Hindi and English.",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Kautilya Classes Railway Psycho Test Portal" }],
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image" },
};

export default async function Home() {
  const packages = await listPackages("alp");
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      name: "Kautilya Classes",
      url: "https://kautilyaonline.com/",
      logo: "https://kautilyaonline.com/kautilya-logo.png",
      telephone: "+919982222301",
      description: "Railway Psycho Test Portal: RRB ALP CBAT practice as per RDSO pattern.",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingPage packages={packages} />
    </>
  );
}
