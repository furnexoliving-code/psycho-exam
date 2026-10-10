import kindsJson from "@/content/seo/kinds.json";
import batteriesJson from "@/content/seo/batteries.json";
import guideJson from "@/content/seo/guide.json";
import { BATTERIES } from "@/lib/wt/categories";
import { LAST_EXAM_CODES, LAST_EXAM_LABEL, sectionByCode, type Section } from "@/lib/wt/sections";

/**
 * The public pages' words, kept as JSON under content/seo so the text can
 * be edited without touching code: the guide to the exam, one page per
 * test (battery) and one page per kind of question (the 19 the hall can
 * give). Counts and clocks are not in the JSON: they come from the hall
 * pattern in lib/wt/sections.ts, the one place that knows them.
 */
export const SITE = "https://kautilyaonline.com";
/** When the words were last revised: the sitemap and the article schema carry it. */
export const CONTENT_PUBLISHED = "2026-10-08";
export const CONTENT_UPDATED = "2026-10-10";

export interface Faq {
  q: string;
  a: string;
}
export interface Step {
  h: string;
  p: string;
}
export interface PlanRow {
  day: string;
  task: string;
}

export interface KindPage {
  kind: "kind";
  code: string;
  slug: string;
  battery: number;
  name: string;
  hindi: string;
  title: string;
  description: string;
  keywords: string[];
  intro: string[];
  introHi: string;
  answerStyle: string;
  how: Step[];
  example: { lines: string[]; answer: string };
  method: Step[];
  tips: Step[];
  mistakes: string[];
  plan: PlanRow[];
  faq: Faq[];
  summaryHi: string;
}

export interface BatteryPage {
  kind: "battery";
  slug: string;
  battery: number;
  name: string;
  hindi: string;
  title: string;
  description: string;
  keywords: string[];
  intro: string[];
  introHi: string;
  kindsIntro: string;
  how: Step[];
  method: Step[];
  tips: Step[];
  mistakes: string[];
  plan: PlanRow[];
  faq: Faq[];
  summaryHi: string;
}

export interface GuidePage {
  kind: "guide";
  title: string;
  description: string;
  keywords: string[];
  intro: string[];
  introHi: string;
  sections: { h: string; paragraphs: string[] }[];
  plan30: { days: string; task: string }[];
  faq: Faq[];
  summaryHi: string;
}

export const KIND_PAGES = kindsJson as KindPage[];
export const BATTERY_PAGES = batteriesJson as BatteryPage[];
export const GUIDE = guideJson as GuidePage;

export function batteryPage(slug: string): BatteryPage | undefined {
  return BATTERY_PAGES.find((b) => b.slug === slug);
}
export function batteryPageOf(battery: number): BatteryPage {
  return BATTERY_PAGES.find((b) => b.battery === battery) as BatteryPage;
}
export function kindPage(batterySlug: string, slug: string): KindPage | undefined {
  const battery = batteryPage(batterySlug)?.battery;
  if (!battery) return undefined;
  return KIND_PAGES.find((k) => k.battery === battery && k.slug === slug);
}
export function kindsOfBattery(battery: number): KindPage[] {
  return KIND_PAGES.filter((k) => k.battery === battery);
}
export function batteryUrl(b: BatteryPage): string {
  return `/psycho-test/${b.slug}`;
}
export function kindUrl(k: KindPage): string {
  return `/psycho-test/${batteryPageOf(k.battery).slug}/${k.slug}`;
}
/** The hall's count and clock for a kind, from the one place that knows them. */
export function hallOf(k: KindPage): Section {
  return sectionByCode(k.code) as Section;
}
/** True when the last exam gave this kind for its battery. */
export function lastExamGave(code: string): boolean {
  return LAST_EXAM_CODES.includes(code);
}
export { LAST_EXAM_LABEL };
export function batteryTitle(battery: number): string {
  return BATTERIES.find((b) => b.id === battery)?.title ?? `Test ${battery}`;
}

/** The lines every test page carries. */
export const DEVICE_TIP: Step = {
  h: "Practise on a laptop or desktop",
  p: "The portal works on a phone too, but the exam hall is a desktop screen with a mouse. Sit every practice paper and Full Mock on a laptop or desktop, so the screen, the mouse and the pace are the ones you will meet on the day.",
};
export const STANDARD_FAQ: Faq[] = [
  { q: "Is there negative marking in the RRB ALP psycho test?", a: "No. The CBAT has no negative marking. Attempt every question; an unanswered question is a mark lost for certain." },
  { q: "What T-Score do I need to pass?", a: "A T-Score of at least 42 in each of the five tests of the CBAT. The portal shows your T-Score on every paper the moment you submit, measured against everyone who sat it." },
  { q: "Can I practise on my phone?", a: "Yes, the portal runs on a phone. But the CBAT is taken on a desktop with a mouse, so Kautilya Classes advises every student to sit the practice papers and Full Mocks on a laptop or desktop: the same screen, the same mouse, the same pace as the hall." },
  { q: "How do I practise this test on the portal?", a: "Every account gets one free Full Mock after login: all five tests in one sitting with the hall's timing and a scorecard with your T-Score in each test. Practice papers of every kind, with the hall's count and clock, come with a Kautilya Classes package. New students message the team on WhatsApp; Kautilya Classes students get their login from the institute." },
];
