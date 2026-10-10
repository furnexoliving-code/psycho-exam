import { ImageResponse } from "next/og";

/**
 * The picture a page shows when its link is shared: the test's name, its
 * place in the CBAT, the hall's count and clock, and the portal's name.
 * English only: the image renderer's font has no Devanagari.
 */
export const OG_SIZE = { width: 1200, height: 630 };

export function ogImage(input: { eyebrow: string; title: string; facts: string[]; footer?: string }) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "linear-gradient(135deg, #0b1f52 0%, #0d2a6b 55%, #1a44b8 100%)", color: "white", padding: "56px 64px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 1 }}>KAUTILYA CLASSES</div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 4, color: "#ff9933" }}>RAILWAY PSYCHO TEST PORTAL</div>
          </div>
          <div style={{ display: "flex", background: "#ff9933", color: "#0d2a6b", fontSize: 20, fontWeight: 800, padding: "10px 18px", borderRadius: 10 }}>Free Full Mock</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 3, color: "#ff9933", textTransform: "uppercase" }}>{input.eyebrow}</div>
          <div style={{ fontSize: input.title.length > 40 ? 56 : 68, fontWeight: 800, lineHeight: 1.1, marginTop: 10 }}>{input.title}</div>
          <div style={{ display: "flex", gap: 14, marginTop: 28, flexWrap: "wrap" }}>
            {input.facts.map((f) => (
              <div key={f} style={{ display: "flex", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 12, padding: "10px 18px", fontSize: 24, fontWeight: 700 }}>{f}</div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#c9d3e6" }}>
          <div>{input.footer ?? "As per RDSO pattern · Hindi + English · T-Score at once"}</div>
          <div style={{ fontWeight: 700, color: "white" }}>kautilyaonline.com</div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
