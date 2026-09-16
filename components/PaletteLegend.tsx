import type { QuestionStatus } from "@/lib/types";

export const STATUS_STYLE: Record<
  QuestionStatus,
  { bg: string; shape: string; label: string }
> = {
  "not-visited": {
    bg: "#d9d9d9",
    shape: "rounded",
    label: "You have not visited the question yet.",
  },
  "not-answered": {
    bg: "#e8453c",
    // The real portal draws this one with a notched bottom edge.
    shape: "rounded-t-md [clip-path:polygon(0_0,100%_0,100%_78%,50%_100%,0_78%)]",
    label: "You have not answered the question.",
  },
  answered: {
    bg: "#4caf50",
    shape: "rounded-b-md [clip-path:polygon(0_22%,50%_0,100%_22%,100%_100%,0_100%)]",
    label: "You have answered the question.",
  },
  marked: {
    bg: "#8e44ad",
    shape: "rounded-full",
    label:
      "You have NOT answered the question, but have marked the question for review.",
  },
  "answered-marked": {
    bg: "#8e44ad",
    shape: "rounded-full",
    label:
      'The question(s) "Answered and Marked for Review" will be considered for evaluation.',
  },
};

/** The five-swatch key shown on the instructions page and beside the palette. */
export function PaletteLegend({ compact = false }: { compact?: boolean }) {
  const order: QuestionStatus[] = [
    "not-visited",
    "not-answered",
    "answered",
    "marked",
    "answered-marked",
  ];

  return (
    <ul className={compact ? "space-y-1.5" : "space-y-3"}>
      {order.map((status) => {
        const style = STATUS_STYLE[status];
        return (
          <li key={status} className="flex items-start gap-3">
            <span className="relative shrink-0">
              <span
                className={`flex h-7 w-7 items-center justify-center text-[11px] font-bold text-white ${style.shape}`}
                style={{
                  background: style.bg,
                  color: status === "not-visited" ? "#374151" : "#fff",
                }}
              >
                {status === "answered-marked" ? "1" : status === "marked" ? "1" : "1"}
              </span>
              {status === "answered-marked" && (
                // The green tick that distinguishes it from a plain review mark.
                <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-500 text-[8px] font-bold text-white">
                  ✓
                </span>
              )}
            </span>
            <span
              className={`${compact ? "text-[11px]" : "text-[13px]"} leading-snug text-gray-700`}
            >
              {style.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
