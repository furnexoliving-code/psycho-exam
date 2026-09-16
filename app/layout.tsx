import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ALP Psycho Test Portal | RRB CBAT Mock Exam",
  description:
    "Computer Based Aptitude Test (CBAT) mock exam portal for RRB ALP candidates, with all five official psycho test sections.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white antialiased">{children}</body>
    </html>
  );
}
