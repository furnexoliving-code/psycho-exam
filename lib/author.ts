/**
 * The teacher the articles are written by, in one place: the byline, the
 * "About the author" box and the Person the search engines are told about
 * all read from here. Facts as Kautilya Classes gave them.
 */
export const AUTHOR = {
  name: "Er. Mahendra Pindel",
  short: "Pindel Sir",
  /** What the byline and the Author field carry. */
  byline: "Er. Mahendra Pindel (Pindel Sir)",
  role: "Founder & Director, Kautilya Classes",
  degree: "M.Tech., NIT Jalandhar",
  college: "NIT Jalandhar",
  years: 10,
  cities: "Jaipur and Jodhpur",
  bio: "Pindel Sir has taught the RRB ALP psycho test (CBAT) for ten years at Kautilya Classes in Jaipur and Jodhpur, with thousands of selections to the institute's name. He built this portal so that every student practises the five tests on a screen like the hall and sees the same T-Score the railway reports.",
  bioHi: "पिंडेल सर दस साल से कौटिल्य क्लासेस, जयपुर और जोधपुर में RRB ALP साइको टेस्ट पढ़ा रहे हैं; संस्थान के नाम हज़ारों चयन हैं।",
  /** The portrait, once the institute supplies one (square, at least 400 px), at public/pindel-sir.jpg. */
  photo: null as string | null,
};

/** True when the article's author is Pindel Sir, under any spelling. */
export function isPindel(author: string): boolean {
  return /pindel/i.test(author);
}
