import type { Verdict } from "@/lib/wt/verdict";

/**
 * The picture a student downloads or shares: one card, 1080 × 1350 when
 * drawn at twice its size, the shape a phone's WhatsApp or Instagram shows
 * whole. It is laid out here, not captured from the page, so it comes out
 * the same on a phone and a laptop, and carries the portal's name and
 * address so a picture passed on brings the next student here.
 *
 * It sits off screen; only the capture reads it.
 */
export function ShareCard({
  id,
  name,
  paper,
  date,
  tScore,
  band,
  marks,
  total,
  attempted,
  accuracy,
  percentile,
  verdict,
  previous,
  pace,
}: {
  id: string;
  name: string;
  paper: string;
  date: string;
  tScore: number | null;
  /** "Well above average" etc.; empty when there is no T-score. */
  band: string;
  marks: number;
  total: number;
  attempted: number;
  accuracy: number | null;
  percentile: number | null;
  verdict: Verdict | null;
  /** The last attempt's marks, when there was one. */
  previous: number | null;
  /** The hall's pace against the pace sat, in words; empty when not measured. */
  pace: { need: string; mine: string; verdict: string } | null;
}) {
  const delta = previous === null ? null : marks - previous;
  // The meter the scorecard shows: 20 to 80, the mean at 50, the hall's bar at 42.
  const at = tScore === null ? null : Math.min(100, Math.max(0, ((tScore - 20) / 60) * 100));
  const bar = ((42 - 20) / 60) * 100;
  const mid = ((50 - 20) / 60) * 100;
  return (
    <div
      id={id}
      aria-hidden="true"
      style={{
        position: "absolute",
        left: -10000,
        top: 0,
        width: 540,
        height: 675,
        background: "#ffffff",
        fontFamily: "Arial, Helvetica, sans-serif",
        color: "#111827",
        overflow: "hidden",
      }}
    >
      {/* Head */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 24px 14px", borderBottom: "3px solid #ff9933" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/kautilya-logo.png" alt="" width={44} height={44} style={{ width: 44, height: 44, objectFit: "contain" }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#0d2a6b", letterSpacing: 0.3 }}>KAUTILYA CLASSES</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#c8102e", letterSpacing: 2, textTransform: "uppercase" }}>Railway Psycho Test Portal</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#0d2a6b", letterSpacing: 1 }}>AS PER RDSO PATTERN</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#c8102e", letterSpacing: 1.5 }}>RRB ALP · CBAT</div>
        </div>
      </div>

      {/* Who and what */}
      <div style={{ padding: "16px 24px 0" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: 2, textTransform: "uppercase" }}>Result</div>
        <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.15, marginTop: 2 }}>{name || "Candidate"}</div>
        <div style={{ fontSize: 13, color: "#4b5563", marginTop: 4 }}>{paper} · {date}</div>
      </div>

      {/* The figure */}
      <div
        style={{
          margin: "14px 24px 0",
          borderRadius: 16,
          padding: "16px 20px",
          color: "#ffffff",
          background: "linear-gradient(120deg,#1565b0 0%,#1668b0 45%,#0f766e 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", opacity: 0.9 }}>{tScore !== null ? "T-Score" : "Score"}</div>
          <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1 }}>
            {tScore !== null ? tScore.toFixed(1) : marks}
            {tScore === null && <span style={{ fontSize: 24, fontWeight: 500, opacity: 0.8 }}> / {total}</span>}
          </div>
          {band && <div style={{ fontSize: 13, fontWeight: 700, marginTop: 6, opacity: 0.95 }}>{band}</div>}
        </div>
        {verdict && (
          <div
            style={{
              borderRadius: 12,
              padding: "10px 14px",
              background: verdict.ok ? "#d1fae5" : "#fee2e2",
              color: verdict.ok ? "#047857" : "#b91c1c",
              textAlign: "center",
              minWidth: 150,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800 }}>{verdict.ok ? "✓ " : ""}{verdict.label}</div>
            <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2 }}>{verdict.note}</div>
          </div>
        )}
      </div>

      {/* Tiles */}
      <div style={{ display: "flex", gap: 10, margin: "12px 24px 0" }}>
        <Tile label="Score" value={`${marks}`} foot={`of ${total}`} bg="#fffbeb" ring="#fde68a" ink="#b45309" />
        <Tile label="Attempted" value={`${attempted}`} foot={`of ${total}`} bg="#eff6ff" ring="#bfdbfe" ink="#1d4ed8" />
        {accuracy !== null && <Tile label="Accuracy" value={`${accuracy.toFixed(0)}%`} foot="of attempted" bg="#ecfdf5" ring="#a7f3d0" ink="#047857" />}
        {percentile !== null && <Tile label="Percentile" value={percentile.toFixed(1)} foot="scored below" bg="#f0fdfa" ring="#99f6e4" ink="#0f766e" />}
      </div>

      {at !== null && (
        <div style={{ margin: "14px 24px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 700, color: "#6b7280", letterSpacing: 1, textTransform: "uppercase" }}>
            <span>T-Score meter</span>
            <span>cut-off 42 · average 50</span>
          </div>
          <div style={{ position: "relative", height: 14, marginTop: 6, borderRadius: 7, background: "#e5e7eb" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${at}%`, borderRadius: 7, background: verdict && !verdict.ok ? "#dc2626" : "#1d4ed8" }} />
            <div style={{ position: "absolute", left: `${bar}%`, top: -4, bottom: -4, width: 2, background: "#b91c1c" }} />
            <div style={{ position: "absolute", left: `${mid}%`, top: -2, bottom: -2, width: 2, background: "#9ca3af" }} />
            <div style={{ position: "absolute", left: `calc(${at}% - 9px)`, top: -2, width: 18, height: 18, borderRadius: 9, background: "#ffffff", border: `4px solid ${verdict && !verdict.ok ? "#dc2626" : "#1d4ed8"}` }} />
          </div>
          <div style={{ position: "relative", height: 14, marginTop: 4, fontSize: 10, color: "#6b7280" }}>
            <span style={{ position: "absolute", left: 0 }}>20</span>
            <span style={{ position: "absolute", left: `${bar}%`, transform: "translateX(-50%)", color: "#b91c1c", fontWeight: 700 }}>42</span>
            <span style={{ position: "absolute", left: `${mid}%`, transform: "translateX(-50%)" }}>50</span>
            <span style={{ position: "absolute", right: 0 }}>80</span>
          </div>
        </div>
      )}

      {pace && (
        <div style={{ margin: "10px 24px 0", borderRadius: 12, padding: "10px 12px", background: "#f9fafb", border: "1px solid #e5e7eb", fontSize: 12, color: "#374151" }}>
          <span style={{ fontWeight: 700, color: "#111827" }}>Hall pace</span> {pace.need} per question · <span style={{ fontWeight: 700, color: "#111827" }}>Your pace</span> {pace.mine} per question
          <div style={{ marginTop: 3, fontWeight: 700, color: "#0d2a6b" }}>{pace.verdict}</div>
        </div>
      )}

      {delta !== null && (
        <div style={{ margin: "10px 24px 0", fontSize: 13, color: "#374151" }}>
          Last attempt {previous}/{total} → now {marks}/{total}{" "}
          <span style={{ fontWeight: 800, color: delta > 0 ? "#047857" : delta < 0 ? "#b91c1c" : "#6b7280" }}>
            ({delta > 0 ? "+" : ""}{delta})
          </span>
        </div>
      )}

      {/* Foot */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "14px 24px",
          background: "#0d2a6b",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#ff9933" }}>kautilyaonline.com</div>
          <div style={{ fontSize: 11, opacity: 0.9, marginTop: 2 }}>RRB ALP psycho test practice · real RDSO pattern · T-Score at once</div>
        </div>
        <div style={{ fontSize: 11, textAlign: "right", opacity: 0.9 }}>
          <div style={{ fontWeight: 700 }}>Kautilya Classes</div>
          <div>19 kinds of test · Full Mocks</div>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, foot, bg, ring, ink }: { label: string; value: string; foot: string; bg: string; ring: string; ink: string }) {
  return (
    <div style={{ flex: 1, borderRadius: 12, padding: "10px 12px", background: bg, border: `1px solid ${ring}` }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: ink, lineHeight: 1.1, marginTop: 2 }}>{value}</div>
      <div style={{ fontSize: 10, color: "#6b7280", marginTop: 1 }}>{foot}</div>
    </div>
  );
}
