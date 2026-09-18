"use client";

import type { Lang, Stimulus as StimulusModel, TrackMap } from "@/lib/types";

/**
 * Railway track maps are drawn as SVG rather than shipped as scans. The same
 * map instance is rendered twice in the memory test — once labelled with real
 * station codes (study page) and once with A-E (test page) — so keeping it as
 * data guarantees the two views line up exactly.
 */
function TrackMapView({ map, label }: { map: TrackMap; label: "code" | "letter" }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-auto max-h-[62vh] w-full max-w-[560px] border border-gray-400 bg-white"
      role="img"
      aria-label="Railway track map"
    >
      {map.tracks.map((track, i) => {
        const points = track.points.map(([x, y]) => `${x},${y}`).join(" ");
        return (
          <g key={i}>
            <polyline
              points={points}
              fill="none"
              stroke="#111827"
              strokeWidth={track.kind === "double" ? 1.6 : 0.9}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* Sleeper hatching that reads as a railway line rather than a road. */}
            <polyline
              points={points}
              fill="none"
              stroke="#111827"
              strokeWidth={track.kind === "double" ? 3.2 : 2.4}
              strokeDasharray="0.6 1.9"
              strokeLinecap="butt"
              opacity={0.85}
            />
          </g>
        );
      })}

      {map.stations.map((station, i) => (
        <g key={i}>
          <circle cx={station.x} cy={station.y} r={1.7} fill="#111827" />
          <text
            x={station.x + station.lx}
            y={station.y + station.ly}
            fontSize={3.4}
            fontWeight={700}
            fill="#111827"
            textAnchor={station.lx < 0 ? "end" : "start"}
          >
            {label === "code" ? station.code : station.letter}
          </text>
        </g>
      ))}
    </svg>
  );
}

const FIGURE_LABELS = ["A", "B", "C", "D", "E", "F"];

function FigureRow({ figures }: { figures: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {figures.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div className="flex h-[92px] w-[92px] items-center justify-center border-2 border-gray-800 bg-white">
            <svg viewBox="0 0 100 100" className="h-full w-full p-1.5" role="img">
              <path
                d={d}
                fill="none"
                stroke="#111827"
                strokeWidth={4}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </div>
          {/* The option letter the candidate marks for this figure. */}
          <span className="text-[13px] font-bold text-gray-900">
            {FIGURE_LABELS[i] ?? i + 1}
          </span>
        </div>
      ))}
    </div>
  );
}

function SymbolGrid({ rows }: { rows: string[][] }) {
  return (
    <table className="border-collapse border-2 border-gray-800 bg-white font-mono">
      <tbody>
        {rows.map((row, r) => (
          <tr key={r}>
            {/* Row numbers, since every question refers to a row by number. */}
            <th
              scope="row"
              className="border border-gray-500 bg-gray-100 px-2 py-1.5 text-center
                         text-[12px] font-bold text-gray-600"
            >
              {r + 1}
            </th>
            {row.map((cell, c) => (
              <td
                key={c}
                className="border border-gray-500 px-2.5 py-1.5 text-center text-[15px] font-bold text-gray-900"
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * A row of items with their positions numbered underneath — the layout the
 * Following Directions test uses, where every question is phrased relative to
 * a position in this row.
 */
function Sequence({
  items,
  showPositions = true,
}: {
  items: string[];
  showPositions?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div
            className="flex h-[52px] w-[52px] items-center justify-center border-2
                       border-gray-800 bg-white text-[22px] font-bold text-gray-900"
          >
            {item}
          </div>
          {showPositions && (
            <span className="text-[11px] text-gray-500">{i + 1}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export function Stimulus({
  stimulus,
  lang,
  trackLabel = "letter",
}: {
  stimulus: StimulusModel;
  lang: Lang;
  /** Memory test study pages show station codes; test pages show letters. */
  trackLabel?: "code" | "letter";
}) {
  switch (stimulus.type) {
    case "track-map":
      return <TrackMapView map={stimulus.map} label={trackLabel} />;
    case "figure-row":
      return <FigureRow figures={stimulus.figures} />;
    case "symbol-grid":
      return <SymbolGrid rows={stimulus.rows} />;
    case "sequence":
      return <Sequence items={stimulus.items} showPositions={stimulus.showPositions} />;
    case "image":
      // eslint-disable-next-line @next/next/no-img-element
      return (
        <img
          src={stimulus.src}
          alt={stimulus.alt[lang]}
          className="h-auto w-full max-w-[560px] border border-gray-400"
        />
      );
    default:
      return null;
  }
}
