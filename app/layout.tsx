import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KAUTILYA CLASSES | Following Directions Test",
  description:
    "Practice portal for the RRB ALP Computer Based Aptitude Test's Following Directions papers — Watch, Letter and Number Table tests.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white antialiased">{children}</body>
    </html>
  );
}
