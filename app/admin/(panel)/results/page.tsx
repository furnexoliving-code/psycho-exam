import Link from "next/link";
import { requireResults } from "@/lib/auth";
import { attemptCounts } from "@/lib/wt/cohorts";
import { BATTERIES, CATEGORIES } from "@/lib/wt/categories";
import { listPapersForAdmin } from "@/lib/wt/db";

/**
 * Every paper's results in one place: the page a result viewer lands on,
 * and the admin's shortcut. Read with the service role, since a viewer's
 * own rights stop at reading results.
 */
export default async function ResultsHome() {
  await requireResults("/admin/results");
  const papers = await listPapersForAdmin();

  // How many attempts, and how many students, each paper has: counted by the database.
  const counts = await attemptCounts();

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900">Results</h1>
      <p className="mt-1 text-[13px] text-gray-600">
        Every paper, with its results table and question analysis. Full Mock results are listed on their own page.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link href="/admin/mocks" className="rounded border border-gray-400 bg-white px-4 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100">
          Full Mock results →
        </Link>
        <span className="ml-2 text-[12px] text-gray-500">Your own copy of the data:</span>
        <a href="/admin/export/results" className="rounded bg-indigo-800 px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-indigo-900">
          ⬇ Export all paper results (CSV)
        </a>
        <a href="/admin/export/mocks" className="rounded bg-indigo-800 px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-indigo-900">
          ⬇ Export all Full Mock results (CSV)
        </a>
        <a href="/admin/export/students" className="rounded border border-indigo-800 bg-white px-4 py-1.5 text-[12px] font-semibold text-indigo-900 hover:bg-indigo-50">
          ⬇ Export students (CSV)
        </a>
      </div>
      <p className="mt-1 text-[11px] text-gray-500">
        Opens in Excel or Google Sheets. Supabase keeps a daily database backup as well; these files are the copy in your own hands.
      </p>

      {BATTERIES.map((battery) => {
        const ids: string[] = CATEGORIES.filter((c) => c.battery === battery.id).map((c) => c.id);
        const mine = papers.filter((p) => ids.includes(p.category ?? "watch"));
        if (mine.length === 0) return null;
        return (
          <section key={battery.id} className="mt-6">
            <h2 className="border-b border-gray-300 pb-1 text-[13px] font-bold uppercase tracking-wide text-gray-500">
              Battery {battery.id} · {battery.title}
            </h2>
            <table className="mt-2 w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-700">
                  <th className="px-3 py-2 font-semibold">Paper</th>
                  <th className="px-3 py-2 font-semibold">Questions</th>
                  <th className="px-3 py-2 font-semibold">Attempts</th>
                  <th className="px-3 py-2 font-semibold">Students</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {mine.map((paper) => (
                  <tr key={paper.slug} className="border-t border-gray-200 bg-white">
                    <td className="px-3 py-2 font-semibold text-gray-900">{paper.displayName}</td>
                    <td className="px-3 py-2 tabular-nums">{paper.questionCount}</td>
                    <td className="px-3 py-2 tabular-nums">{(counts.get(paper.id)?.attempts ?? 0).toLocaleString("en-IN")}</td>
                    <td className="px-3 py-2 tabular-nums">{(counts.get(paper.id)?.students ?? 0).toLocaleString("en-IN")}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${paper.isPublished ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}>
                        {paper.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link href={`/admin/papers/${paper.slug}/results`} className="font-semibold text-rrb-banner hover:underline">
                        Results
                      </Link>
                      <Link href={`/admin/papers/${paper.slug}/analysis`} className="ml-4 font-semibold text-rrb-banner hover:underline">
                        Question analysis
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
    </>
  );
}
