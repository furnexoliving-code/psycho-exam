"use client";

import type { MockSummaryTest } from "@/lib/wt/mock";

/**
 * The hall's Exam Summary, shown in every break of a Full Mock: each test
 * in order, with a table of its groups for the ones finished and "Yet to
 * attempt" for the rest. The test on screen, when there is one, is drawn
 * by its own break screen above this list and left out here.
 */
export function ExamSummaryList({ tests, skipBattery }: { tests: MockSummaryTest[]; skipBattery?: number }) {
  return (
    <div className="space-y-4">
      {tests
        .filter((t) => t.battery !== skipBattery)
        .map((t) => (
          <div key={t.battery}>
            <p className="text-[0.8em] font-semibold text-[#222]">
              Test {t.battery} - {t.title} / <span lang="hi">{t.hindi}</span> :{" "}
              {t.status === "done" ? "( Attempted Group ; View not allowed; Edit not allowed)" : "( Yet to attempt )"}
            </p>
            {t.status === "done" && <SummaryTable rows={t.rows} />}
          </div>
        ))}
    </div>
  );
}

export function SummaryTable({ rows }: { rows: { name: string; total: number; answered: number; notVisited?: number }[] }) {
  return (
    <table className="mt-2 w-full border-collapse text-center text-[0.8em]">
      <thead>
        <tr className="bg-[#cfe3f5] text-[#222]">
          <th className="border border-[#999] px-3 py-1.5 font-semibold">Section Name</th>
          <th className="border border-[#999] px-3 py-1.5 font-semibold">No. of Questions</th>
          <th className="border border-[#999] px-3 py-1.5 font-semibold">Answered</th>
          <th className="border border-[#999] px-3 py-1.5 font-semibold">Not Answered</th>
          <th className="border border-[#999] px-3 py-1.5 font-semibold">Not Visited</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name} className="bg-white text-[#222]">
            <td className="border border-[#999] px-3 py-1.5">{r.name}</td>
            <td className="border border-[#999] px-3 py-1.5">{r.total}</td>
            <td className="border border-[#999] px-3 py-1.5">{r.answered}</td>
            <td className="border border-[#999] px-3 py-1.5">{r.total - r.answered - (r.notVisited ?? 0)}</td>
            <td className="border border-[#999] px-3 py-1.5">{r.notVisited ?? 0}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
