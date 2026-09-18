"use client";

import type { CutOff, Standing, TopicRow } from "@/app/api/watch-table/score/route";

/** mm:ss, or h:mm:ss once an attempt runs past an hour. */
export function duration(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}

export function CutOffBadge({ cutOff }: { cutOff: CutOff | null }) {
  if (!cutOff) return null;

  return (
    <div
      className={`mt-4 rounded border px-4 py-3 ${
        cutOff.qualified
          ? "border-green-400 bg-green-50"
          : "border-red-400 bg-red-50"
      }`}
    >
      <div className="flex flex-wrap items-baseline gap-x-3">
        <span
          className={`text-[17px] font-bold ${
            cutOff.qualified ? "text-green-800" : "text-red-800"
          }`}
        >
          {cutOff.qualified ? "Qualified" : "Not qualified"}
        </span>
        <span className="text-[12px] text-gray-600">{cutOff.reason}</span>
      </div>
    </div>
  );
}

export function StandingCard({ standing }: { standing: Standing | null }) {
  if (!standing) return null;

  return (
    <>
      <Stat label="Rank" value={`${standing.rank} / ${standing.outOf}`} />
      <Stat label="Percentile" value={standing.percentile.toFixed(1)} />
    </>
  );
}

export function ExpertComment({ comment }: { comment: string | null }) {
  if (!comment) return null;

  return (
    <section className="mt-6">
      <h2 className="text-[13px] font-bold uppercase tracking-wide text-gray-500">
        Expert&apos;s comment
      </h2>
      <p className="mt-2 rounded border border-gray-300 bg-white px-4 py-4 text-[19px] font-semibold text-wt-submit">
        {comment}
      </p>
    </section>
  );
}

/**
 * Where the marks were lost, weakest topic first — the one line of the result
 * that tells a candidate what to go and revise.
 */
export function TopicBreakdown({ topics }: { topics: TopicRow[] }) {
  if (topics.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="text-[16px] font-bold text-gray-900">Where the marks went</h2>
      <p className="mt-1 text-[12px] text-gray-600">
        Weakest first. Accuracy is over the questions you attempted.
      </p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-rrb-banner text-left text-white">
              <th className="border border-gray-300 px-3 py-2">Topic</th>
              <th className="border border-gray-300 px-3 py-2">Questions</th>
              <th className="border border-gray-300 px-3 py-2">Attempted</th>
              <th className="border border-gray-300 px-3 py-2">Correct</th>
              <th className="border border-gray-300 px-3 py-2">Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((row) => (
              <tr key={row.topic} className="bg-white even:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2 font-semibold text-gray-900">
                  {row.topic}
                </td>
                <td className="border border-gray-300 px-3 py-2">{row.total}</td>
                <td className="border border-gray-300 px-3 py-2">{row.attempted}</td>
                <td className="border border-gray-300 px-3 py-2">{row.correct}</td>
                <td className="border border-gray-300 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-[70px] overflow-hidden rounded bg-gray-200">
                      <span
                        className={`block h-full ${
                          row.accuracy >= 60
                            ? "bg-green-500"
                            : row.accuracy >= 30
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${Math.max(2, row.accuracy)}%` }}
                      />
                    </span>
                    <span>
                      {row.attempted ? `${row.accuracy.toFixed(0)}%` : "—"}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function TimeAnalysis({
  takenSec,
  allowedSec,
  attempted,
}: {
  takenSec: number | null;
  allowedSec: number;
  attempted: number;
}) {
  if (takenSec === null) return null;

  const used = Math.min(100, (takenSec / allowedSec) * 100);
  const perQuestion = attempted > 0 ? takenSec / attempted : null;

  return (
    <section className="mt-6">
      <h2 className="text-[16px] font-bold text-gray-900">Time</h2>

      <div className="mt-3 rounded border border-gray-300 bg-white px-4 py-4">
        <div className="flex flex-wrap gap-x-8 gap-y-1 text-[13px]">
          <Pair label="Taken" value={duration(takenSec)} />
          <Pair label="Allowed" value={duration(allowedSec)} />
          <Pair
            label="Left unused"
            value={duration(Math.max(0, allowedSec - takenSec))}
          />
          <Pair
            label="Per attempted question"
            value={perQuestion === null ? "—" : duration(perQuestion)}
          />
        </div>

        <div className="mt-3 h-3 overflow-hidden rounded bg-gray-200">
          <div className="h-full bg-wt-submit" style={{ width: `${used}%` }} />
        </div>
        <p className="mt-1 text-[11px] text-gray-500">
          {used.toFixed(0)}% of the time was used.
        </p>
      </div>
    </section>
  );
}

export interface PastAttempt {
  at: number;
  marks: number;
  total: number;
  attempted: number;
  durationSec: number | null;
}

/** Earlier attempts at this paper, newest last, so progress reads left to right. */
export function AttemptHistory({ attempts }: { attempts: PastAttempt[] }) {
  if (attempts.length < 2) return null;

  return (
    <section className="mt-6">
      <h2 className="text-[16px] font-bold text-gray-900">Your attempts</h2>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-rrb-banner text-left text-white">
              <th className="border border-gray-300 px-3 py-2">Attempt</th>
              <th className="border border-gray-300 px-3 py-2">Score</th>
              <th className="border border-gray-300 px-3 py-2">Attempted</th>
              <th className="border border-gray-300 px-3 py-2">Time</th>
              <th className="border border-gray-300 px-3 py-2">Change</th>
              <th className="border border-gray-300 px-3 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((a, i) => {
              const previous = i > 0 ? attempts[i - 1].marks : null;
              const change = previous === null ? null : a.marks - previous;
              const latest = i === attempts.length - 1;

              return (
                <tr
                  key={a.at}
                  className={latest ? "bg-[#eef8fb] font-semibold" : "bg-white even:bg-gray-50"}
                >
                  <td className="border border-gray-300 px-3 py-2">
                    Attempt {i + 1}
                    {latest && (
                      <span className="ml-2 text-[10px] uppercase text-wt-submit">
                        this one
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    {a.marks} / {a.total}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">{a.attempted}</td>
                  <td className="border border-gray-300 px-3 py-2">
                    {a.durationSec === null ? "—" : duration(a.durationSec)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    {change === null ? (
                      "—"
                    ) : (
                      <span
                        className={
                          change > 0
                            ? "font-semibold text-green-700"
                            : change < 0
                              ? "font-semibold text-red-700"
                              : "text-gray-500"
                        }
                      >
                        {change > 0 ? `+${change}` : change === 0 ? "no change" : change}
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    {new Date(a.at).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5">
      <span className="text-gray-500">{label}:</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-gray-300 bg-white px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
