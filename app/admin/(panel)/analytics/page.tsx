import Link from "next/link";
import { requireResults } from "@/lib/auth";
import { examSettings } from "@/lib/settings";
import { AnalyticsPending, batchAnalytics } from "@/lib/wt/analytics";
import { AnalyticsView } from "@/components/admin/AnalyticsView";

/** Reading every attempt once can take a while on a cold cache. */
export const maxDuration = 40;

/** The batch in figures: who is practising, who is ready, which papers are hardest. */
export default async function AnalyticsPage() {
  await requireResults("/admin/analytics");
  const exam = await examSettings();
  try {
    const a = await batchAnalytics(exam.passT, exam.targetT);
    return <AnalyticsView a={a} />;
  } catch (error) {
    if (!(error instanceof AnalyticsPending)) throw error;
    // The database is making the first cut of the figures: a minute or
    // two on a big table. Nothing to show yet, and nothing wrong.
    return (
      <>
        <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-5 text-[13px] text-amber-950">
          <p className="font-semibold">The figures are being cut in the database.</p>
          <p className="mt-1">
            The first cut takes a minute or two on a big table; after that they are kept up to date every ten minutes.
            <span className="block" lang="hi">आंकड़े डेटाबेस में बन रहे हैं; एक-दो मिनट बाद यह पेज दोबारा खोलें।</span>
          </p>
          <Link href="/admin/analytics" className="mt-3 inline-block rounded bg-indigo-800 px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-indigo-900">
            Reload
          </Link>
        </div>
      </>
    );
  }
}
