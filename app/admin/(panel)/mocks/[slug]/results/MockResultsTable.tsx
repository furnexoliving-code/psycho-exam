"use client";

import { useMemo, useState } from "react";

export interface MockResultRow {
  rank: number;
  name: string;
  phone: string;
  when: string;
  tests: { battery: number; marks: number; total: number; tScore: number | null }[];
  composite: number | null;
  out30: number | null;
  qualified: boolean | null;
  latest: boolean;
}

/** Every scorecard of a mock: filter, sort by composite, download as CSV. */
export function MockResultsTable({ rows, batteries }: { rows: MockResultRow[]; batteries: number[] }) {
  const [q, setQ] = useState("");
  const [only, setOnly] = useState<"all" | "qualified" | "not">("all");

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (needle && !r.name.toLowerCase().includes(needle) && !r.phone.includes(needle)) return false;
      if (only === "qualified" && r.qualified !== true) return false;
      if (only === "not" && r.qualified !== false) return false;
      return true;
    });
  }, [rows, q, only]);

  const csv = () => {
    const head = ["Rank", "Name", "Mobile", "Date", ...batteries.flatMap((b) => [`Test ${b} marks`, `Test ${b} T`]), "Composite", "Out of 30", "Qualified"];
    const lines = visible.map((r) => [
      r.rank,
      r.name,
      r.phone,
      r.when,
      ...batteries.flatMap((b) => {
        const t = r.tests.find((x) => x.battery === b);
        return [t ? `${t.marks}/${t.total}` : "", t?.tScore ?? ""];
      }),
      r.composite ?? "",
      r.out30 ?? "",
      r.qualified === null ? "" : r.qualified ? "Yes" : "No",
    ]);
    const text = [head, ...lines].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "full-mock-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or mobile" className="w-[240px] rounded border border-gray-400 px-3 py-1.5 text-[13px]" />
        <select value={only} onChange={(e) => setOnly(e.target.value as typeof only)} className="rounded border border-gray-400 px-3 py-1.5 text-[13px]">
          <option value="all">All</option>
          <option value="qualified">Qualified only</option>
          <option value="not">Not qualified only</option>
        </select>
        <span className="text-[12px] text-gray-600">{visible.length} of {rows.length}</span>
        <button type="button" onClick={csv} className="ml-auto rounded border border-gray-400 bg-white px-4 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100">
          Download CSV
        </button>
      </div>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-rrb-banner text-left text-white">
              <th className="border border-gray-300 px-2 py-2">Rank</th>
              <th className="border border-gray-300 px-2 py-2">Name</th>
              <th className="border border-gray-300 px-2 py-2">Mobile</th>
              <th className="border border-gray-300 px-2 py-2">Date</th>
              {batteries.map((b) => (
                <th key={b} className="border border-gray-300 px-2 py-2">Test {b}</th>
              ))}
              <th className="border border-gray-300 px-2 py-2">Composite</th>
              <th className="border border-gray-300 px-2 py-2">/ 30</th>
              <th className="border border-gray-300 px-2 py-2">Qualified</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={i} className={`bg-white even:bg-gray-50 ${r.latest ? "" : "text-gray-500"}`}>
                <td className="border border-gray-300 px-2 py-1.5 tabular-nums">{r.rank}</td>
                <td className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-900">{r.name}{!r.latest && <span className="ml-1 text-[10px] font-normal text-gray-400">(earlier)</span>}</td>
                <td className="border border-gray-300 px-2 py-1.5">{r.phone}</td>
                <td className="border border-gray-300 px-2 py-1.5">{r.when}</td>
                {batteries.map((b) => {
                  const t = r.tests.find((x) => x.battery === b);
                  return (
                    <td key={b} className="border border-gray-300 px-2 py-1.5 tabular-nums">
                      {t ? (
                        <>
                          <b>{t.tScore === null ? "—" : t.tScore.toFixed(1)}</b>
                          <span className="ml-1 text-gray-500">{t.marks}/{t.total}</span>
                        </>
                      ) : "—"}
                    </td>
                  );
                })}
                <td className="border border-gray-300 px-2 py-1.5 font-bold tabular-nums">{r.composite === null ? "—" : r.composite.toFixed(1)}</td>
                <td className="border border-gray-300 px-2 py-1.5 font-bold tabular-nums">{r.out30 === null ? "—" : r.out30.toFixed(1)}</td>
                <td className="border border-gray-300 px-2 py-1.5">
                  {r.qualified === true ? <span className="rounded bg-green-100 px-1.5 py-0.5 font-semibold text-green-800">Yes</span>
                    : r.qualified === false ? <span className="rounded bg-red-100 px-1.5 py-0.5 font-semibold text-red-800">No</span>
                    : <span className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-800">Pending</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
