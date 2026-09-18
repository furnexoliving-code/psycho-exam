import { DIRECTIONS, type Direction, type WatchTable } from "@/lib/wt/types";

/**
 * The circular watch table, drawn as SVG so the same data can render the study
 * diagram, the example on the instruction page, and the review screen without
 * any image asset.
 *
 * Geometry is in a 0-400 box. North is at the top and the compass points run
 * clockwise, matching how the questions describe travel.
 */

const CX = 200;
const CY = 200;
const R = 158;

/** Where each direction sits on the circle, in degrees clockwise from north. */
const ANGLE: Record<Direction, number> = {
  N: 0,
  NE: 45,
  E: 90,
  SE: 135,
  S: 180,
  SW: 225,
  W: 270,
  NW: 315,
};

function pointAt(direction: Direction, radius: number) {
  const rad = ((ANGLE[direction] - 90) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

/**
 * Labels sit just inside the circle. Each is nudged so it clears the dot and
 * reads the way it does on the printed paper.
 */
const LABEL: Record<Direction, { dx: number; dy: number; anchor: "start" | "middle" | "end" }> = {
  N: { dx: 0, dy: 26, anchor: "middle" },
  NE: { dx: -6, dy: 22, anchor: "middle" },
  E: { dx: -12, dy: 6, anchor: "end" },
  SE: { dx: -6, dy: -12, anchor: "middle" },
  S: { dx: 0, dy: -14, anchor: "middle" },
  SW: { dx: 6, dy: -12, anchor: "middle" },
  W: { dx: 12, dy: 6, anchor: "start" },
  NW: { dx: 6, dy: 22, anchor: "middle" },
};

export function WatchTableDiagram({
  table,
  watermark = "Kautilya Classes",
  className = "",
  boxedValues = false,
}: {
  table: WatchTable;
  watermark?: string;
  className?: string;
  /**
   * The reference draws a square around each number on the instruction
   * page's example, but NOT on the live question diagram at easy level.
   */
  boxedValues?: boolean;
}) {
  const byDirection = new Map(table.cells.map((c) => [c.direction, c]));
  const [markLeft, markRight] = splitWatermark(watermark);

  return (
    <svg
      viewBox="0 0 400 400"
      className={`h-auto w-full max-w-[520px] ${className}`}
      role="img"
      aria-label={describe(table)}
    >
      <title>{describe(table)}</title>

      <text x={14} y={72} fontSize={13} fill="#d7edfa" fontWeight={600}>
        {markLeft}
      </text>
      <text x={386} y={72} fontSize={13} fill="#d7edfa" fontWeight={600} textAnchor="end">
        {markRight}
      </text>

      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#111827" strokeWidth={5} />

      <CompassRose />

      {/* Direction words, in the order the compass card prints them. */}
      <CardinalWord x={CX} y={CY - 74} en="NORTH" hi="उत्तर" letter="N" stack="up" />
      <CardinalWord x={CX} y={CY + 74} en="SOUTH" hi="दक्षिण" letter="S" stack="down" />
      <CardinalWord x={CX - 74} y={CY} en="WEST" hi="पश्चिम" letter="W" stack="left" />
      <CardinalWord x={CX + 74} y={CY} en="EAST" hi="पूर्व" letter="E" stack="right" />

      {DIRECTIONS.map((direction) => {
        const cell = byDirection.get(direction);
        if (!cell) return null;
        const dot = pointAt(direction, R);
        const label = LABEL[direction];
        return (
          <g key={direction}>
            <circle cx={dot.x} cy={dot.y} r={8} fill="#111827" />
            {boxedValues ? (
              <BoxedLabel
                x={dot.x + label.dx}
                y={dot.y + label.dy}
                anchor={label.anchor}
                letter={cell.letter}
                value={cell.value}
              />
            ) : (
              <text
                x={dot.x + label.dx}
                y={dot.y + label.dy}
                fontSize={24}
                fontWeight={600}
                fill="#111827"
                textAnchor={label.anchor}
              >
                {cell.letter}
                {cell.value}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Letter beside a number drawn inside a square, as the printed example does. */
function BoxedLabel({
  x,
  y,
  anchor,
  letter,
  value,
}: {
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
  letter: string;
  value: number;
}) {
  const BOX = 17;
  // Lay the pair out from a common left edge so the square never overlaps
  // the letter, whichever way the label is anchored.
  const width = 15 + BOX;
  const left = anchor === "end" ? x - width : anchor === "middle" ? x - width / 2 : x;

  return (
    <g>
      <text x={left} y={y} fontSize={22} fontWeight={600} fill="#111827">
        {letter}
      </text>
      <rect
        x={left + 15}
        y={y - BOX + 3}
        width={BOX}
        height={BOX}
        fill="none"
        stroke="#111827"
        strokeWidth={1.6}
      />
      <text
        x={left + 15 + BOX / 2}
        y={y - 1}
        fontSize={15}
        fontWeight={600}
        fill="#111827"
        textAnchor="middle"
      >
        {value}
      </text>
    </g>
  );
}

/** The eight-pointed star at the centre: solid cardinals, hairline diagonals. */
function CompassRose() {
  const solid = [0, 90, 180, 270]
    .map((deg) => star(deg, 62, 13))
    .join(" ");
  const hair = [45, 135, 225, 315].map((deg) => star(deg, 46, 9)).join(" ");

  return (
    <g>
      <path d={hair} fill="#ffffff" stroke="#111827" strokeWidth={1} />
      <path d={solid} fill="#111827" />
      {[45, 135, 225, 315].map((deg) => {
        const rad = ((deg - 90) * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={CX}
            y1={CY}
            x2={CX + 74 * Math.cos(rad)}
            y2={CY + 74 * Math.sin(rad)}
            stroke="#111827"
            strokeWidth={1.6}
          />
        );
      })}
    </g>
  );
}

/** One kite-shaped point of the rose, pointing `deg` degrees clockwise from north. */
function star(deg: number, length: number, width: number): string {
  const rad = ((deg - 90) * Math.PI) / 180;
  const perp = rad + Math.PI / 2;
  const tip = { x: CX + length * Math.cos(rad), y: CY + length * Math.sin(rad) };
  const a = { x: CX + width * Math.cos(perp), y: CY + width * Math.sin(perp) };
  const b = { x: CX - width * Math.cos(perp), y: CY - width * Math.sin(perp) };
  return `M${tip.x.toFixed(1)},${tip.y.toFixed(1)} L${a.x.toFixed(1)},${a.y.toFixed(1)} L${CX},${CY} L${b.x.toFixed(1)},${b.y.toFixed(1)} Z`;
}

function CardinalWord({
  x,
  y,
  en,
  hi,
  letter,
  stack,
}: {
  x: number;
  y: number;
  en: string;
  hi: string;
  letter: string;
  stack: "up" | "down" | "left" | "right";
}) {
  if (stack === "up" || stack === "down") {
    const dir = stack === "up" ? -1 : 1;
    return (
      <g textAnchor="middle">
        <text x={x} y={y - dir * 0} fontSize={17} fontWeight={700} fill="#111827">
          {letter}
        </text>
        <text x={x} y={y + dir * 19} fontSize={15} fontWeight={600} fill="#1f7bc4">
          {en}
        </text>
        <text x={x} y={y + dir * 36} fontSize={13} fontWeight={600} fill="#da0000">
          {hi}
        </text>
      </g>
    );
  }

  // East and West print their words turned on their side, as on the paper.
  const dir = stack === "left" ? -1 : 1;
  return (
    <g>
      <text x={x} y={y + 6} fontSize={17} fontWeight={700} fill="#111827" textAnchor="middle">
        {letter}
      </text>
      <text
        x={x + dir * 18}
        y={y}
        fontSize={15}
        fontWeight={600}
        fill="#1f7bc4"
        textAnchor="middle"
        transform={`rotate(${dir * -90} ${x + dir * 18} ${y})`}
      >
        {en}
      </text>
      <text
        x={x + dir * 36}
        y={y}
        fontSize={13}
        fontWeight={600}
        fill="#da0000"
        textAnchor="middle"
        transform={`rotate(${dir * -90} ${x + dir * 36} ${y})`}
      >
        {hi}
      </text>
    </g>
  );
}

function splitWatermark(text: string): [string, string] {
  const parts = text.split(" ");
  if (parts.length < 2) return [text, ""];
  const mid = Math.ceil(parts.length / 2);
  return [parts.slice(0, mid).join(" "), parts.slice(mid).join(" ")];
}

/** Screen-reader description, so the diagram is not a blank to assistive tech. */
function describe(table: WatchTable): string {
  const parts = DIRECTIONS.map((d) => {
    const cell = table.cells.find((c) => c.direction === d);
    return cell ? `${d}: ${cell.letter}${cell.value}` : null;
  }).filter(Boolean);
  return `Watch table ${table.label}. Going clockwise from North — ${parts.join(", ")}.`;
}
