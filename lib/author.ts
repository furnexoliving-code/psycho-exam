/**
 * Who stands behind the articles. They are written by the team (the
 * byline), and every one of them carries the educator's box: the teacher
 * whose method they describe, and the Person the search engines are told
 * about. Facts as Kautilya Classes gave them.
 */
export const WRITER = "Team Kautilya";

export const EDUCATOR = {
  name: "Er. Mahendra Pindel",
  short: "Pindel Sir",
  /** The name with the one students use. */
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

/** True when an article names Pindel Sir himself as its writer, under any spelling. */
export function isPindel(author: string): boolean {
  return /pindel/i.test(author);
}
