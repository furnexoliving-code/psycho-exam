"use client";

import { useMemo, useState } from "react";
import { duration } from "@/components/wt/ResultPanels";

export interface ResultRow {
  id: string;
  name: string;
  phone: string;
  marks: number;
  total: number;
  attempted: number;
  durationSec: number | null;
  tScore: number | null;
  rank: number;
  /** This is the candidate's most recent attempt of the paper. */
  latest: boolean;
  qualified: boolean | null;
  submittedAt: string;
}

/** Rows shown per page: a table of thousands is not one anyone reads. */
const PAGE_SIZE = 100;

type CutOffFilter = "all" | "yes" | "no" | "unset";
type SortKey = "rank" | "tscore" | "newest" | "oldest" | "name" | "fastest";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "rank", label: "Rank (highest marks first)" },
  { value: "tscore", label: "T-score, highest first" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name, A to Z" },
  { value: "fastest", label: "Fastest first" },
];

/** Wraps a value for CSV: quotes it, and doubles any quote inside. */
function csvCell(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

/** The day an attempt was submitted, in the viewer's own calendar. */
function dayOf(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Every attempt of the paper, with the filters a big batch needs.
 *
 * The rows are all here already, so filtering and sorting happen in the
 * browser at once, with no round trip; only what is shown is paged. The CSV
 * takes exactly what the filters leave, in the order shown, so the file the
 * admin downloads is the list they were looking at.
 */
export function ResultsTable({ rows, slug }: { rows: ResultRow[]; slug: string }) {
  const [search, setSearch] = useState("");
  const [cutOff, setCutOff] = useState<CutOffFilter>("all");
  const [latestOnly, setLatestOnly] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<SortKey>("rank");
  const [page, setPage] = useState(1);

  const shown = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const digits = needle.replace(/\D/g, "");

    const kept = rows.filter((r) => {
      if (latestOnly && !r.latest) return false;
      if (cutOff === "yes" && r.qualified !== true) return false;
      if (cutOff === "no" && r.qualified !== false) return false;
      if (cutOff === "unset" && r.qualified !== null) return false;
      if (from && dayOf(r.submittedAt) < from) return false;
      if (to && dayOf(r.submittedAt) > to) return false;
      if (needle) {
        const byName = r.name.toLowerCase().includes(needle);
        const byPhone = digits.length >= 3 && r.phone.includes(digits);
        if (!byName && !byPhone) return false;
      }
      return true;
    });

    const time = (r: ResultRow) => new Date(r.submittedAt).getTime();
    const by: Record<SortKey, (a: ResultRow, b: ResultRow) => number> = {
      rank: (a, b) => b.marks - a.marks || time(b) - time(a),
      tscore: (a, b) => (b.tScore ?? -Infinity) - (a.tScore ?? -Infinity) || time(b) - time(a),
      newest: (a, b) => time(b) - time(a),
      oldest: (a, b) => time(a) - time(b),
      name: (a, b) => a.name.localeCompare(b.name) || time(b) - time(a),
      fastest: (a, b) =>
        (a.durationSec ?? Infinity) - (b.durationSec ?? Infinity) || b.marks - a.marks,
    };
    return [...kept].sort(by[sort]);
  }, [rows, search, cutOff, latestOnly, from, to, sort]);

  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const slice = shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const qualifiedCount = shown.filter((r) => r.qualified === true).length;

  /** Any change to a filter starts again from the first page. */
  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  const download = () => {
    const header = [
      "Rank",
      "Name",
      "Mobile",
      "Marks",
      "Out of",
      "Attempted",
      "T-score",
      "Qualified",
      "Latest attempt",
      "Time taken",
      "Submitted at",
    ];

    const lines = [
      header.map(csvCell).join(","),
      ...shown.map((r) =>
        [
          r.rank,
          r.name,
          r.phone,
          r.marks,
          r.total,
          r.attempted,
          r.tScore,
          r.qualified === null ? "" : r.qualified ? "Yes" : "No",
          r.latest ? "Yes" : "No",
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

  const field =
    "rounded border border-gray-400 bg-white px-2 py-1.5 text-[12px] text-gray-900";

  return (
    <div className="mt-6">
      <div className="rounded border border-gray-300 bg-white p-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-gray-700">Search</span>
            <input
              value={search}
              onChange={(e) => reset(setSearch)(e.target.value)}
              placeholder="Name or mobile"
              className={`${field} w-[200px]`}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-gray-700">Cut off</span>
            <select value={cutOff} onChange={(e) => reset(setCutOff)(e.target.value as CutOffFilter)} className={field}>
              <option value="all">All</option>
              <option value="yes">Qualified</option>
              <option value="no">Not qualified</option>
              <option value="unset">Not decided</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-gray-700">From</span>
            <input type="date" value={from} onChange={(e) => reset(setFrom)(e.target.value)} className={field} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-gray-700">To</span>
            <input type="date" value={to} onChange={(e) => reset(setTo)(e.target.value)} className={field} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-gray-700">Order</span>
            <select value={sort} onChange={(e) => reset(setSort)(e.target.value as SortKey)} className={field}>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 pb-1.5 text-[12px] text-gray-800">
            <input
              type="checkbox"
              checked={latestOnly}
              onChange={(e) => reset(setLatestOnly)(e.target.checked)}
            />
            Latest attempt per student only
          </label>
          <button
            type="button"
            onClick={download}
            className="ml-auto rounded border border-gray-400 bg-white px-4 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100"
          >
            Download CSV ({shown.length})
          </button>
        </div>
        <p className="mt-2 text-[12px] text-gray-600">
          Showing <strong>{shown.length.toLocaleString("en-IN")}</strong> of{" "}
          {rows.length.toLocaleString("en-IN")} attempts
          {shown.length > 0 && qualifiedCount > 0 && (
            <>
              {" "}· <strong>{qualifiedCount.toLocaleString("en-IN")}</strong> qualified
            </>
          )}
          {latestOnly && " · one row per student"}
        </p>
      </div>

      {shown.length === 0 ? (
        <p className="mt-4 rounded border border-gray-300 bg-white px-4 py-8 text-center text-[13px] text-gray-500">
          No attempt matches these filters.
        </p>
      ) : (
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
              {slice.map((r) => (
                <tr key={r.id} className="bg-white even:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2">{r.rank}</td>
                  <td className="border border-gray-300 px-3 py-2">
                    <div className="font-semibold text-gray-900">{r.name}</div>
                    <div className="text-[11px] text-gray-500">
                      {r.phone || "—"}
                      {!r.latest && " · earlier attempt"}
                    </div>
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

          {pages > 1 && (
            <nav className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-gray-700" aria-label="Pages">
              <button
                type="button"
                disabled={current <= 1}
                onClick={() => setPage(current - 1)}
                className="rounded border border-gray-400 bg-white px-3 py-1 font-semibold hover:bg-gray-100 disabled:opacity-40"
              >
                ← Previous
              </button>
              <span>
                Page {current} of {pages} · rows {(current - 1) * PAGE_SIZE + 1}–
                {Math.min(shown.length, current * PAGE_SIZE)}
              </span>
              <button
                type="button"
                disabled={current >= pages}
                onClick={() => setPage(current + 1)}
                className="rounded border border-gray-400 bg-white px-3 py-1 font-semibold hover:bg-gray-100 disabled:opacity-40"
              >
                Next →
              </button>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
