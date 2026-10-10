import { KIND_PAGES, batteryPageOf, hallOf, kindPage } from "@/lib/seo/content";
import { OG_SIZE, ogImage } from "@/lib/seo/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "RRB ALP psycho test on the Railway Psycho Test Portal";

export function generateStaticParams() {
  return KIND_PAGES.map((k) => ({ slug: batteryPageOf(k.battery).slug, test: k.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string; test: string }> }) {
  const { slug, test } = await params;
  const page = kindPage(slug, test);
  const hall = page ? hallOf(page) : null;
  return ogImage({
    eyebrow: page ? `${page.code} · Test ${page.battery} · ${batteryPageOf(page.battery).name}` : "RRB ALP CBAT",
    title: page ? page.name : "RRB ALP Psycho Test",
    facts: hall ? [`${hall.questions} questions`, `${hall.timeMin} min`, "T-Score 42 to pass"] : [],
  });
}
