import Link from "next/link";
import type { AttemptAllowance } from "@/lib/wt/attempts";
import type { PaperSummary } from "@/lib/wt/db";

/** One test, with what it costs in time and what the candidate has left. */
export function PaperCard({
  paper,
  allowance,
}: {
  paper: PaperSummary;
  allowance: AttemptAllowance;
}) {
  return (
    <article className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-rrb-banner hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[16px] font-bold text-gray-900">{paper.displayName}</h3>
        {allowance.max !== null && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              allowance.exhausted
                ? "bg-red-50 text-red-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {allowance.exhausted ? "Finished" : `${allowance.remaining} left`}
          </span>
        )}
      </div>

      <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-gray-600">
        <div className="flex items-center gap-1.5">
          <span aria-hidden="true">📝</span>
          <span>{paper.questionCount} questions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span aria-hidden="true">⏱</span>
          <span>{paper.timeLimitMin} min</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span aria-hidden="true">📖</span>
          <span>{paper.instructionTimeMin} min to read</span>
        </div>
      </dl>

      {allowance.max !== null && (
        <p className="mt-2 text-[11px] text-gray-500">
          {allowance.used} of {allowance.max} attempts used
        </p>
      )}

      <div className="mt-4 flex gap-2 pt-1">
        {allowance.exhausted ? (
          <span className="flex-1 cursor-not-allowed rounded-lg bg-gray-100 px-4 py-2.5 text-center text-[13px] font-semibold text-gray-400">
            Attempts finished
          </span>
        ) : (
          <Link
            href={`/watch-table/${paper.slug}`}
            className="flex-1 rounded-lg bg-indigo-800 px-4 py-2.5 text-center text-[13px] font-semibold text-white shadow-sm hover:bg-indigo-900"
          >
            {allowance.used > 0 ? "Re-attempt" : "Start test"}
          </Link>
        )}
        {allowance.used > 0 && (
          <Link
            href={`/watch-table/${paper.slug}/result`}
            className="flex-1 rounded-lg border border-indigo-800 px-4 py-2.5 text-center text-[13px] font-semibold text-indigo-800 hover:bg-indigo-50"
          >
            Result
          </Link>
        )}
      </div>
    </article>
  );
}
