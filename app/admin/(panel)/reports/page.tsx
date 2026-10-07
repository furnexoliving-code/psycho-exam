import Link from "next/link";
import { requireEditor } from "@/lib/auth";
import { formatDateTime } from "@/lib/format-time";
import { openReports } from "@/lib/reports";
import { RowForm } from "@/components/admin/RowForm";
import { resolveReports } from "./actions";

/**
 * The questions students have flagged from their reviews, most flagged
 * first. The surest way to catch a wrong key with ten thousand students
 * is to let them say so.
 */
export default async function ReportsPage() {
  await requireEditor("/admin/reports");
  const reports = (await openReports()).sort((a, b) => b.count - a.count || b.latestAt.localeCompare(a.latestAt));

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900">Question reports</h1>
      <p className="mt-1 text-[13px] text-gray-600">
        Questions students flagged as wrong from their result review. Check the question on its paper, fix it if needed, then clear the flags.
      </p>

      {reports.length === 0 ? (
        <p className="mt-4 rounded border border-dashed border-gray-300 bg-white p-8 text-center text-[13px] text-gray-500">
          No open reports. ✅
        </p>
      ) : (
        <table className="mt-4 w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-rrb-banner text-left text-white">
              <th className="border border-gray-300 px-3 py-2">Paper</th>
              <th className="border border-gray-300 px-3 py-2">Question</th>
              <th className="border border-gray-300 px-3 py-2">Reports</th>
              <th className="border border-gray-300 px-3 py-2">What students wrote</th>
              <th className="border border-gray-300 px-3 py-2">Latest</th>
              <th className="border border-gray-300 px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.questionId} className="bg-white even:bg-gray-50 align-top">
                <td className="border border-gray-300 px-3 py-2 font-semibold text-gray-900">
                  {r.paperSlug ? <Link href={`/admin/papers/${r.paperSlug}`} className="text-rrb-banner hover:underline">{r.paperName}</Link> : r.paperName}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  Q. {r.position || "?"}
                  {r.paperSlug && (
                    <Link href={`/admin/papers/${r.paperSlug}/analysis`} className="ml-2 text-[11px] font-semibold text-rrb-banner hover:underline">
                      analysis
                    </Link>
                  )}
                </td>
                <td className="border border-gray-300 px-3 py-2 tabular-nums">
                  <span className={`rounded px-2 py-0.5 text-[11px] font-bold ${r.count >= 5 ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"}`}>{r.count}</span>
                </td>
                <td className="border border-gray-300 px-3 py-2 text-[12px] text-gray-700">
                  {r.notes.length === 0 ? <span className="text-gray-400">(no note)</span> : r.notes.map((n, i) => <span key={i} className="block">“{n}”</span>)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-[12px] text-gray-600">{formatDateTime(r.latestAt)}</td>
                <td className="border border-gray-300 px-3 py-2">
                  <RowForm action={resolveReports}>
                    <input type="hidden" name="question" value={r.questionId} />
                    <button type="submit" className="rounded border border-gray-400 px-2 py-1 text-[11px] font-semibold text-gray-800 hover:bg-gray-100">
                      Clear flags
                    </button>
                  </RowForm>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
