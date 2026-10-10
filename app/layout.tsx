import type { Metadata } from "next";
import type { Viewport } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@/components/Analytics";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://kautilyaonline.com"),
  // Google Search Console: paste the code from "HTML tag" verification
  // into GOOGLE_SITE_VERIFICATION in Vercel; nothing shows without it.
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  title: "KAUTILYA CLASSES | RAILWAY PSYCHO TEST PORTAL",
  // Only the front page overrides this: everything behind the login stays
  // out of search engines.
  robots: { index: false, follow: false },
  description:
    "Kautilya Classes Railway Psycho Test Portal: RRB ALP CBAT practice as per RDSO pattern, with all five tests, Full Mock Tests and instant T-Score.",
  applicationName: "Railway Psycho Test Portal",
  openGraph: { siteName: "Kautilya Classes · Railway Psycho Test Portal", locale: "en_IN", type: "website", images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Kautilya Classes Railway Psycho Test Portal" }] },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#0d2a6b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white antialiased">
        {children}
        {/* How fast pages open for students, by page and device, measured in
            their browsers: one page view in five, which keeps it inside the
            plan's included quota. It runs on the live site only. */}
        <SpeedInsights sampleRate={0.2} />
        <Analytics />
      </body>
    </html>
  );
}
