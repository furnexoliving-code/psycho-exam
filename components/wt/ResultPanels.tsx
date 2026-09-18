"use client";

import type { CutOff, Standing, TopicRow } from "@/app/api/watch-table/score/route";
import type { TScore } from "@/lib/wt/tscore";

/**
 * The analysis screen's pieces.
 *
 * Colour choices come from a validated palette rather than taste. The check
 * that shaped the most code: status green against status red measures a
 * deuteranopia delta-E of 4.1, so roughly one man in twelve cannot tell them
 * apart. Nothing here signals correct or incorrect by colour alone — every
 * one carries a glyph and a word as well.
 *
 * Marks follow the same spec throughout: bars at most 24px thick with a 4px
 * rounded data-end, 2px lines, markers at least 8px with a 2px surface ring,
 * solid hairline gridlines, and text in ink tokens rather than the data colour.
 */

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

/* ------------------------------------------------------------------ */
/* Outcome marks — glyph + word + colour, never colour alone           */
/* ------------------------------------------------------------------ */

export type Outcome = "correct" | "incorrect" | "unattempted";

export const OUTCOME: Record<Outcome, { glyph: string; label: string; color: string }> = {
  correct: { glyph: "✓", label: "Correct", color: "var(--good)" },
  incorrect: { glyph: "✕", label: "Incorrect", color: "var(--critical)" },
  unattempted: { glyph: "–", label: "Unattempted", color: "var(--text-muted)" },
};

export function OutcomeTag({ outcome }: { outcome: Outcome }) {
  const o = OUTCOME[outcome];
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold">
      <span
        aria-hidden="true"
        className="flex h-[18px] w-[18px] items-center justify-center rounded-full text-[11px] text-white"
        style={{ background: o.color }}
      >
        {o.glyph}
      </span>
      <span style={{ color: "var(--text-secondary)" }}>{o.label}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

export function Card({
  title,
  subtitle,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg p-5 ${className}`}
      style={{
        background: "var(--surface-1)",
        boxShadow: "0 1px 2px rgba(11,11,11,0.05)",
        border: "1px solid var(--hairline)",
      }}
    >
      {title && (
        <header className="mb-3">
          <h2
            className="text-[15px] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-[12px]" style={{ color: "var(--text-muted)" }}>
              {subtitle}
            </p>
          )}
        </header>
      )}
      {children}
    </section>
  );
}

/**
 * A stat tile: label in sentence case, value in semibold sans with the font's
 * proportional figures — tabular figures make a number like 121 look loose at
 * this size.
 */
export function Stat({
  label,
  value,
  foot,
}: {
  label: string;
  value: string;
  foot?: string;
}) {
  return (
    <div
      className="rounded-lg px-4 py-3"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--hairline)",
      }}
    >
      <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div
        className="mt-0.5 text-[22px] font-semibold leading-tight"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </div>
      {foot && (
        <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          {foot}
        </div>
      )}
    </div>
  );
}

export function StandingCards({ standing }: { standing: Standing | null }) {
  if (!standing) return null;
  return (
    <>
      <Stat
        label="Rank"
        value={String(standing.rank)}
        foot={`of ${standing.outOf}`}
      />
      <Stat
        label="Percentile"
        value={standing.percentile.toFixed(1)}
        foot="scored below you"
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* The hero figure — exactly one per view                              */
/* ------------------------------------------------------------------ */

/**
 * The T-score, led with. A meter places it against 50, which is the average
 * candidate by construction, so the number is read in context rather than
 * alone.
 */
export function TScoreHero({
  tScore,
  marks,
  total,
}: {
  tScore: TScore | null;
  marks: number;
  /** Marks available, so the fallback hero has a scale to sit on. */
  total: number;
}) {
  // Until a cohort exists the T-score has no number, and an empty hero slot is
  // worse than none. Lead with the figure that always exists — the marks — and
  // keep the T-score as the footnote it currently is.
  if (!tScore) {
    const pct = total > 0 ? (marks / total) * 100 : 0;
    return (
      <Card>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
          <div>
            <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Score
            </div>
            <div
              className="text-[52px] font-semibold leading-none"
              style={{ color: "var(--text-primary)" }}
            >
              {marks}
              <span
                className="text-[22px] font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                {" / "}
                {total}
              </span>
            </div>
          </div>
          <p className="mb-1 max-w-sm text-[12px]" style={{ color: "var(--text-secondary)" }}>
            Marks scored on this paper.
          </p>
        </div>

        <div
          className="relative mt-5 h-2 rounded-full"
          style={{ background: "var(--series-1-track)" }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${pct}%`, background: "var(--series-1)" }}
          />
        </div>

        <p
          className="mt-6 rounded px-3 py-2 text-[12px]"
          style={{ background: "var(--plane)", color: "var(--text-secondary)" }}
        >
          <strong style={{ color: "var(--text-primary)" }}>T-Score not available yet.</strong>{" "}
          It places a candidate against everyone who has sat this paper, so it
          needs either enough submitted attempts or the reference figures set in
          the admin panel.
        </p>
      </Card>
    );
  }

  const { cohort, value } = tScore;
  // The meter spans 20 to 80: four standard deviations either side of the mean
  // covers all but a handful of candidates.
  const LO = 20;
  const HI = 80;
  const pos = Math.min(100, Math.max(0, ((value - LO) / (HI - LO)) * 100));
  const mid = ((50 - LO) / (HI - LO)) * 100;

  return (
    <Card>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
        <div>
          <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            T-Score
          </div>
          <div
            className="text-[52px] font-semibold leading-none"
            style={{ color: "var(--text-primary)" }}
          >
            {value.toFixed(1)}
          </div>
        </div>
        <p className="mb-1 max-w-sm text-[12px]" style={{ color: "var(--text-secondary)" }}>
          50 is the average candidate. Every 10 points is one standard deviation
          away from that average.
        </p>
      </div>

      <div className="relative mt-5 h-2 rounded-full" style={{ background: "var(--series-1-track)" }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${pos}%`, background: "var(--series-1)" }}
        />
        {/* The midpoint tick — a hairline, not a dashed rule. */}
        <span
          className="absolute -top-1 h-4 w-px"
          style={{ left: `${mid}%`, background: "var(--text-muted)" }}
          aria-hidden="true"
        />
        <span
          className="absolute -bottom-5 -translate-x-1/2 text-[10px]"
          style={{ left: `${mid}%`, color: "var(--text-muted)" }}
        >
          50
        </span>
        {/* Marker with a 2px surface ring so it stays legible over the fill. */}
        <span
          className="absolute top-1/2 h-[14px] w-[14px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: `${pos}%`,
            background: "var(--series-1)",
            boxShadow: "0 0 0 2px var(--surface-1)",
          }}
          aria-hidden="true"
        />
      </div>

      <dl
        className="mt-8 flex flex-wrap gap-x-8 gap-y-1 text-[12px]"
        style={{ color: "var(--text-secondary)" }}
      >
        <Pair label="Your marks" value={String(marks)} />
        <Pair label="Mean" value={cohort.mean.toFixed(2)} />
        <Pair label="Standard deviation" value={cohort.sd.toFixed(2)} />
        <Pair
          label={cohort.source === "cohort" ? "Papers compared" : "Figures"}
          value={cohort.source === "cohort" ? String(cohort.count) : "institute reference"}
        />
      </dl>

      <p
        className="mt-3 rounded px-3 py-2 text-[12px]"
        style={{ background: "var(--plane)", color: "var(--text-secondary)" }}
      >
        T = 50 + 10 × ({marks} − {cohort.mean.toFixed(2)}) ÷ {cohort.sd.toFixed(2)} ={" "}
        <strong style={{ color: "var(--text-primary)" }}>{value.toFixed(1)}</strong>
      </p>

      {tScore.note && (
        <p className="mt-2 text-[12px]" style={{ color: "var(--text-secondary)" }}>
          {tScore.note}
        </p>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Cut off                                                             */
/* ------------------------------------------------------------------ */

export function CutOffBanner({ cutOff }: { cutOff: CutOff | null }) {
  if (!cutOff) return null;

  const tone = cutOff.qualified
    ? { color: "var(--good)", glyph: "✓", label: "Qualified" }
    : { color: "var(--critical)", glyph: "✕", label: "Not qualified" };

  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-4 py-3"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--hairline)",
        borderLeft: `4px solid ${tone.color}`,
      }}
    >
      <span
        aria-hidden="true"
        className="flex h-6 w-6 items-center justify-center rounded-full text-[13px] text-white"
        style={{ background: tone.color }}
      >
        {tone.glyph}
      </span>
      <span className="text-[16px] font-semibold" style={{ color: "var(--text-primary)" }}>
        {tone.label}
      </span>
      <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
        {cutOff.reason}
      </span>
    </div>
  );
}

export function ExpertComment({ comment }: { comment: string | null }) {
  if (!comment) return null;

  return (
    <Card title="Expert's comment">
      <p className="text-[17px] font-medium" style={{ color: "var(--text-primary)" }}>
        {comment}
      </p>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Topic breakdown                                                     */
/* ------------------------------------------------------------------ */

/**
 * Accuracy per topic, weakest first.
 *
 * One series, so no legend: the card's title already says what is plotted.
 * Length carries the value and a single hue carries nothing extra — colouring
 * each bar by how good it is would double-encode and turn the card into a
 * traffic light. The weak ones are called out with a glyph and a word instead.
 */
export function TopicBreakdown({ topics }: { topics: TopicRow[] }) {
  if (topics.length === 0) return null;

  return (
    <Card
      title="Where the marks went"
      subtitle="Accuracy over the questions you attempted. Weakest first."
    >
      <ul className="space-y-3">
        {topics.map((row) => {
          const weak = row.attempted > 0 && row.accuracy < 50;
          return (
            <li key={row.topic}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span
                  className="text-[13px] font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {row.topic}
                  {weak && (
                    <span
                      className="ml-2 inline-flex items-center gap-1 align-middle text-[11px] font-semibold"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-[15px] w-[15px] items-center justify-center rounded-full text-[10px] text-white"
                        style={{ background: "var(--warning)" }}
                      >
                        !
                      </span>
                      needs work
                    </span>
                  )}
                </span>
                <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                  {row.correct} of {row.attempted || 0} attempted · {row.total} asked
                </span>
              </div>

              <div className="mt-1.5 flex items-center gap-3">
                {/* Bar: capped thickness, rounded data-end, square at baseline. */}
                <div
                  className="h-3 flex-1 overflow-hidden rounded-[2px]"
                  style={{ background: "var(--series-1-track)" }}
                >
                  <div
                    className="h-full rounded-r-[4px]"
                    style={{
                      width: `${Math.max(row.attempted ? 1.5 : 0, row.accuracy)}%`,
                      background: "var(--series-1)",
                    }}
                  />
                </div>
                {/* The value rides the bar's end, in ink — never the data colour. */}
                <span
                  className="w-[46px] shrink-0 text-right text-[13px] font-semibold tabular-nums"
                  style={{ color: "var(--text-primary)" }}
                >
                  {row.attempted ? `${row.accuracy.toFixed(0)}%` : "—"}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Time                                                                */
/* ------------------------------------------------------------------ */

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
    <Card title="Time">
      <div
        className="flex flex-wrap gap-x-8 gap-y-1 text-[12px]"
        style={{ color: "var(--text-secondary)" }}
      >
        <Pair label="Taken" value={duration(takenSec)} />
        <Pair label="Allowed" value={duration(allowedSec)} />
        <Pair label="Left unused" value={duration(Math.max(0, allowedSec - takenSec))} />
        <Pair
          label="Per attempted question"
          value={perQuestion === null ? "—" : duration(perQuestion)}
        />
      </div>

      <div
        className="mt-3 h-3 overflow-hidden rounded-[2px]"
        style={{ background: "var(--series-1-track)" }}
      >
        <div
          className="h-full rounded-r-[4px]"
          style={{ width: `${Math.max(1, used)}%`, background: "var(--series-1)" }}
        />
      </div>
      <p className="mt-1.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
        {used.toFixed(0)}% of the allowed time was used.
      </p>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Attempt history                                                     */
/* ------------------------------------------------------------------ */

export interface PastAttempt {
  at: number;
  marks: number;
  total: number;
  attempted: number;
  durationSec: number | null;
}

/**
 * Marks across attempts. One series, so no legend, and only the last point is
 * labelled — a number on every point goes unread. The table underneath carries
 * every value, so nothing is gated behind reading the line.
 */
export function AttemptHistory({ attempts }: { attempts: PastAttempt[] }) {
  if (attempts.length < 2) return null;

  const W = 560;
  const H = 120;
  const PAD = { top: 14, right: 46, bottom: 22, left: 30 };
  const total = attempts[0].total || 1;

  const x = (i: number) =>
    PAD.left + (i / (attempts.length - 1)) * (W - PAD.left - PAD.right);
  const y = (marks: number) =>
    PAD.top + (1 - marks / total) * (H - PAD.top - PAD.bottom);

  const path = attempts.map((a, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(a.marks)}`).join(" ");
  const last = attempts[attempts.length - 1];

  return (
    <Card title="Your attempts" subtitle={`Marks out of ${total}, oldest first.`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Marks across ${attempts.length} attempts: ${attempts.map((a) => a.marks).join(", ")}.`}
      >
        {/* Solid hairline gridlines, one shade off the surface. */}
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(total * t)}
              y2={y(total * t)}
              stroke="var(--grid)"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 6}
              y={y(total * t) + 3}
              textAnchor="end"
              fontSize={9}
              fill="var(--text-muted)"
            >
              {Math.round(total * t)}
            </text>
          </g>
        ))}

        <path d={path} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {attempts.map((a, i) => (
          <g key={a.at}>
            {/* 2px surface ring keeps the marker legible where it meets the line. */}
            <circle cx={x(i)} cy={y(a.marks)} r={5} fill="var(--series-1)" stroke="var(--surface-1)" strokeWidth={2} />
            <text x={x(i)} y={H - 6} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
              {i + 1}
            </text>
          </g>
        ))}

        {/* Only the endpoint is labelled. */}
        <text
          x={x(attempts.length - 1) + 10}
          y={y(last.marks) + 4}
          fontSize={12}
          fontWeight={600}
          fill="var(--text-primary)"
        >
          {last.marks}
        </text>
      </svg>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr style={{ color: "var(--text-muted)" }}>
              {["Attempt", "Score", "Attempted", "Time", "Change", "Date"].map((h) => (
                <th
                  key={h}
                  className="px-2 py-1.5 text-left font-medium"
                  style={{ borderBottom: "1px solid var(--grid)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {attempts.map((a, i) => {
              const previous = i > 0 ? attempts[i - 1].marks : null;
              const change = previous === null ? null : a.marks - previous;
              const latest = i === attempts.length - 1;

              return (
                <tr key={a.at} style={{ borderBottom: "1px solid var(--grid)" }}>
                  <td className="px-2 py-1.5" style={{ color: "var(--text-primary)" }}>
                    {i + 1}
                    {latest && (
                      <span className="ml-2 text-[10px]" style={{ color: "var(--text-muted)" }}>
                        this one
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {a.marks} / {a.total}
                  </td>
                  <td className="px-2 py-1.5 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                    {a.attempted}
                  </td>
                  <td className="px-2 py-1.5 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                    {a.durationSec === null ? "—" : duration(a.durationSec)}
                  </td>
                  <td className="px-2 py-1.5">
                    {change === null ? (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    ) : (
                      // Direction carries a glyph as well as a colour.
                      <span
                        className="inline-flex items-center gap-1 font-semibold tabular-nums"
                        style={{
                          color:
                            change > 0
                              ? "var(--success-text)"
                              : change < 0
                                ? "var(--critical)"
                                : "var(--text-muted)",
                        }}
                      >
                        {change > 0 ? "▲" : change < 0 ? "▼" : "•"}
                        {change > 0 ? `+${change}` : change === 0 ? "0" : change}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1.5" style={{ color: "var(--text-secondary)" }}>
                    {new Date(a.at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5">
      <dt style={{ color: "var(--text-muted)" }}>{label}:</dt>
      <dd className="font-semibold" style={{ color: "var(--text-primary)" }}>
        {value}
      </dd>
    </div>
  );
}
