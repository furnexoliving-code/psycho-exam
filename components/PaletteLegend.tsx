import type { QuestionStatus } from "@/lib/types";

/**
 * Palette swatch styles, matching the exam screen: a green up-arrow tab for
 * answered, a red down-arrow tab for not answered, a plain grey box for
 * questions not opened yet.
 */
export const STATUS_STYLE: Record<
  QuestionStatus,
  { bg: string; fg: string; shape: string; label: string; labelHi: string }
> = {
  answered: {
    bg: "#4d9e3f",
    fg: "#ffffff",
    shape: "[clip-path:polygon(0_22%,50%_0,100%_22%,100%_100%,0_100%)]",
    label: "Answered",
    labelHi: "हल किये गए प्रश्न",
  },
  "not-answered": {
    bg: "#d9463a",
    fg: "#ffffff",
    shape: "[clip-path:polygon(0_0,100%_0,100%_78%,50%_100%,0_78%)]",
    label: "Not Answered",
    labelHi: "हल नहीं किये गए प्रश्न",
  },
  "not-visited": {
    bg: "#c9c9c9",
    fg: "#333333",
    shape: "rounded-[2px]",
    label: "Not Visited",
    labelHi: "अभी तक अनदेखे प्रश्न",
  },
};

/** Legend order on screen: answered, not answered, not visited. */
export const LEGEND_ORDER: QuestionStatus[] = ["answered", "not-answered", "not-visited"];

export function PaletteLegend({
  counts,
  compact = false,
}: {
  /** Live counts shown inside each swatch, as the real palette does. */
  counts?: Record<QuestionStatus, number>;
  compact?: boolean;
}) {
  return (
    <ul className={`flex flex-wrap ${compact ? "gap-x-4 gap-y-1.5" : "gap-x-6 gap-y-2"}`}>
      {LEGEND_ORDER.map((status) => {
        const style = STATUS_STYLE[status];
        return (
          <li key={status} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center text-[12px] font-bold ${style.shape}`}
              style={{ background: style.bg, color: style.fg }}
            >
              {counts ? counts[status] : ""}
            </span>
            <span className={`${compact ? "text-[11px]" : "text-[12px]"} text-gray-800`}>
              {style.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
