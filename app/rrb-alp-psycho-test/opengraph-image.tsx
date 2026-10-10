import { OG_SIZE, ogImage } from "@/lib/seo/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "RRB ALP Psycho Test (CBAT): the complete guide";

export default function Image() {
  return ogImage({ eyebrow: "The complete guide", title: "RRB ALP Psycho Test (CBAT)", facts: ["5 tests", "T-Score 42 in each", "30% of the final merit", "No negative marking"] });
}
