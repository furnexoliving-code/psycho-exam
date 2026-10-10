import { BATTERY_PAGES, batteryPage, hallOf, kindsOfBattery } from "@/lib/seo/content";
import { OG_SIZE, ogImage } from "@/lib/seo/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "RRB ALP psycho test on the Railway Psycho Test Portal";

export function generateStaticParams() {
  return BATTERY_PAGES.map((b) => ({ slug: b.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = batteryPage(slug);
  const kinds = page ? kindsOfBattery(page.battery) : [];
  const q = kinds.map((k) => hallOf(k).questions);
  return ogImage({
    eyebrow: page ? `Test ${page.battery} of 5 · RRB ALP CBAT` : "RRB ALP CBAT",
    title: page ? page.name : "RRB ALP Psycho Test",
    facts: page ? [`${kinds.length} kinds of question`, `${Math.min(...q)} to ${Math.max(...q)} questions`, "T-Score 42 to pass"] : [],
  });
}
