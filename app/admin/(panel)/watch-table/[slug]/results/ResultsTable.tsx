"use client";

import { duration } from "@/components/wt/ResultPanels";

export interface ResultRow {
  id: string;
  name: string;
  rollNo: string;
  marks: number;
  total: number;
  attempted: number;
  durationSec: number | null;
  tScore: number | null;
  rank: number;
  qualified: boolean | null;
  submittedAt: string;
}

/** Wraps a value for CSV: quotes it, and doubles any quote inside. */
function csvCell(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function ResultsTable({ rows, slug }: { rows: ResultRow[]; slug: string }) {
  const download = () => {
    const header = [
      "Rank",
      "Name",
      "Roll no",
      "Marks",
      "Out of",
      "Attempted",
      "T-score",
      "Qualified",
      "Time taken",
      "Submitted at",
    ];

    const lines = [
      header.map(csvCell).join(","),
      ...rows.map((r) =>
        [
          r.rank,
          r.name,
          r.rollNo,
          r.marks,
          r.total,
          r.attempted,
          r.tScore,
          r.qualified === null ? "" : r.qualified ? "Yes" : "No",
          r.durationSec === null ? "" : duration(r.durationSec),
          new Date(r.submittedAt).toLocaleString("en-IN"),
        ]
          .map(csvCell)
          .join(","),
      ),
    ].join("\n");

    // The BOM makes Excel open UTF-8 correctly, which matters for Hindi names.
    const blob = new Blob(["﻿" + lines], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (rows.length === 0) {
    return (
      <p className="mt-6 rounded border border-gray-300 bg-white px-4 py-8 text-center text-[13px] text-gray-500">
        Nobody has submitted this paper yet.
      </p>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-gray-900">
          Every attempt ({rows.length})
        </h2>
        <button
          type="button"
          onClick={download}
          className="rounded border border-gray-400 bg-white px-4 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100"
        >
          Download CSV
        </button>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-rrb-banner text-left text-white">
              <th className="border border-gray-300 px-3 py-2">Rank</th>
              <th className="border border-gray-300 px-3 py-2">Candidate</th>
              <th className="border border-gray-300 px-3 py-2">Marks</th>
              <th className="border border-gray-300 px-3 py-2">Attempted</th>
              <th className="border border-gray-300 px-3 py-2">T-score</th>
              <th className="border border-gray-300 px-3 py-2">Cut off</th>
              <th className="border border-gray-300 px-3 py-2">Time</th>
              <th className="border border-gray-300 px-3 py-2">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="bg-white even:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2">{r.rank}</td>
                <td className="border border-gray-300 px-3 py-2">
                  <div className="font-semibold text-gray-900">{r.name}</div>
                  <div className="text-[11px] text-gray-500">{r.rollNo}</div>
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {r.marks} / {r.total}
                </td>
                <td className="border border-gray-300 px-3 py-2">{r.attempted}</td>
                <td className="border border-gray-300 px-3 py-2">
                  {r.tScore === null ? "—" : r.tScore.toFixed(1)}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {r.qualified === null ? (
                    <span className="text-gray-400">not set</span>
                  ) : (
                    <span
                      className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                        r.qualified
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {r.qualified ? "Qualified" : "Not qualified"}
                    </span>
                  )}
                </td>
                <td className="border border-gray-300 px-3 py-2 font-mono tabular-nums">
                  {r.durationSec === null ? "—" : duration(r.durationSec)}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {new Date(r.submittedAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
