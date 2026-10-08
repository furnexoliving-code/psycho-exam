import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://kautilyaonline.com"),
  title: "KAUTILYA CLASSES | RAILWAY PSYCHO TEST PORTAL",
  // Only the front page overrides this: everything behind the login stays
  // out of search engines.
  robots: { index: false, follow: false },
  description:
    "Kautilya Classes Railway Psycho Test Portal: RRB ALP CBAT practice as per RDSO pattern, with all five tests, Full Mock Tests and instant T-Score.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white antialiased">{children}</body>
    </html>
  );
}
