import { requireResults } from "@/lib/auth";
import { examSettings } from "@/lib/settings";
import { batchAnalytics } from "@/lib/wt/analytics";
import { AnalyticsView } from "@/components/admin/AnalyticsView";

/** Reading every attempt once can take a while on a cold cache. */
export const maxDuration = 40;

/** The batch in figures: who is practising, who is ready, which papers are hardest. */
export default async function AnalyticsPage() {
  await requireResults("/admin/analytics");
  const exam = await examSettings();
  const a = await batchAnalytics(exam.passT, exam.targetT);
  return <AnalyticsView a={a} />;
}
