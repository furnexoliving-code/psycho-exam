/**
 * The panel's two small charts, drawn as plain SVG so a server component
 * can send them: columns for a count per day, and a sparkline for a
 * student's T-scores over time. Thin marks, a hairline baseline, the
 * values on hover (the browser's own tooltip) and a table view beside,
 * as the portal's result panels do.
 */

export interface DayPoint {
  /** The day, as "2026-10-09". */
  day: string;
  value: number;
}

/** One series of counts per day: ≤ 24px columns on a hairline baseline, the peak and the last day labelled. */
export function Columns({ title, note, points, unit }: { title: string; note?: string; points: DayPoint[]; unit: string }) {
  const W = 440;
  const H = 128;
  const padL = 8;
  const padR = 8;
  const top = 18;
  const base = H - 22;
  const n = Math.max(1, points.length);
  const slot = (W - padL - padR) / n;
  const bw = Math.min(24, Math.max(4, slot - 4));
  const max = Math.max(1, ...points.map((p) => p.value));
  const peak = points.reduce((best, p, i) => (p.value > (points[best]?.value ?? -1) ? i : best), 0);
  const y = (v: number) => base - (v / max) * (base - top);
  const id = `clip-${title.replace(/[^a-z0-9]/gi, "").toLowerCase()}`;
  return (
    <figure className="min-w-0">
      <figcaption className="text-[12.5px] font-bold text-gray-900">
        {title} {note && <span className="font-normal text-gray-500">· {note}</span>}
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-1 h-auto w-full" role="img" aria-label={`${title}: ${points.map((p) => `${p.day.slice(8)} ${p.value}`).join(", ")}`}>
        <defs>
          <clipPath id={id}>
            <rect x="0" y="0" width={W} height={base} />
          </clipPath>
        </defs>
        <line x1={padL} x2={W - padR} y1={base + 0.5} y2={base + 0.5} stroke="#e5e7eb" strokeWidth="1" />
        {points.map((p, i) => {
          const x = padL + i * slot + (slot - bw) / 2;
          const h = p.value === 0 ? 0 : Math.max(2, base - y(p.value));
          const labelled = i === peak || i === points.length - 1;
          return (
            <g key={p.day}>
              {/* The hit area is the whole slot, wider than the mark. */}
              <rect x={padL + i * slot} y={top - 10} width={slot} height={base - top + 10} fill="transparent">
                <title>{`${formatDay(p.day)}: ${p.value} ${unit}`}</title>
              </rect>
              <rect x={x} y={base - h} width={bw} height={h + 4} rx="4" fill="#2a78d6" clipPath={`url(#${id})`} pointerEvents="none" />
              {labelled && p.value > 0 && (
                <text x={x + bw / 2} y={base - h - 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#111827">
                  {p.value}
                </text>
              )}
              {((points.length - 1 - i) % 2 === 0 || points.length <= 8) && (
                <text x={x + bw / 2} y={H - 6} textAnchor="middle" fontSize="9.5" fill="#6b7280">
                  {p.day.slice(8)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <details className="mt-1">
        <summary className="cursor-pointer text-[11px] font-semibold text-gray-500 hover:text-gray-800">Table view</summary>
        <table className="mt-1 w-full border-collapse text-[11px]">
          <tbody>
            {points.map((p) => (
              <tr key={p.day} className="border-t border-gray-100">
                <td className="py-0.5 text-gray-600">{formatDay(p.day)}</td>
                <td className="py-0.5 text-right tabular-nums text-gray-900">{p.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

function formatDay(day: string): string {
  const d = new Date(`${day}T00:00:00+05:30`);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
}

/** A student's T-scores in one battery over time: a 2px line, 8px markers, the pass mark as a hairline. */
export function Sparkline({ points, pass, label }: { points: { t: number; at: string }[]; pass: number; label: string }) {
  const W = 180;
  const H = 48;
  const padX = 6;
  const top = 6;
  const bottom = H - 8;
  const lo = Math.min(pass - 10, ...points.map((p) => p.t));
  const hi = Math.max(pass + 10, ...points.map((p) => p.t));
  const y = (t: number) => bottom - ((t - lo) / (hi - lo || 1)) * (bottom - top);
  const x = (i: number) => (points.length === 1 ? W / 2 : padX + (i / (points.length - 1)) * (W - padX * 2));
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.t).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-12 w-[180px]" role="img" aria-label={`${label}: ${points.map((p) => p.t.toFixed(0)).join(", ")}`}>
      <line x1={padX} x2={W - padX} y1={y(pass)} y2={y(pass)} stroke="#d1d5db" strokeWidth="1" />
      <text x={W - padX} y={y(pass) - 2} textAnchor="end" fontSize="8" fill="#9ca3af">
        {pass}
      </text>
      {points.length > 1 && <path d={path} fill="none" stroke="#2a78d6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.t)} r={i === points.length - 1 ? 4.5 : 3.5} fill={p.t >= pass ? "#2a78d6" : "#d03b3b"} stroke="#ffffff" strokeWidth="2">
          <title>{`${p.t.toFixed(1)} · ${new Date(p.at).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}`}</title>
        </circle>
      ))}
    </svg>
  );
}
