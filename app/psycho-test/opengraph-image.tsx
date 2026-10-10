import { OG_SIZE, ogImage } from "@/lib/seo/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "All 19 kinds of question in the RRB ALP psycho test";

export default function Image() {
  return ogImage({ eyebrow: "RRB ALP CBAT · the complete list", title: "All 19 kinds of question, test by test", facts: ["5 tests", "19 kinds of question", "T-Score 42 in each"] });
}
