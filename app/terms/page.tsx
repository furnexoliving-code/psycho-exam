import type { Metadata } from "next";
import { PolicyPage } from "@/components/landing/PolicyPage";

export const metadata: Metadata = { title: "Terms of Use | Kautilya Classes Railway Psycho Test Portal", robots: { index: true, follow: true } };

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms of Use"
      titleHi="उपयोग की शर्तें"
      updated="8 October 2026"
      sections={[
        { h: "1. The service", p: ["kautilyaonline.com (the Portal) is run by Kautilya Classes, Rajasthan. It offers practice tests for the Computer Based Aptitude Test (CBAT) of railway recruitment, on the RDSO pattern. The Portal is a practice tool; it is not affiliated with the Railway Recruitment Boards or RDSO, and it does not promise selection."] },
        { h: "2. Accounts", p: ["An account is for one student. The mobile number is the login ID. One account may be signed in on one device at a time; sharing an account, or using another person's account, is not allowed and may lead to the account being switched off without refund.", "Students of Kautilya Classes receive their account and packages from the institute. Anyone else may create a free account and buy a package."] },
        { h: "3. Packages and payment", p: ["A package opens the tests it names (sectional tests, Full Mock Tests, or both) for the validity period shown at purchase. Prices include all applicable taxes. Payments are collected through Razorpay; Kautilya Classes does not store card or bank details.", "A package is for personal use and cannot be transferred or resold."] },
        { h: "4. Content", p: ["All papers, questions, pictures and software on the Portal belong to Kautilya Classes. Copying, recording, screenshotting or distributing any paper or question is prohibited and may lead to the account being switched off."] },
        { h: "5. Fair use", p: ["The Portal may switch an account off for sharing, for attempts to copy content, or for interfering with the service. Scores and T-Scores on the Portal are for practice; they are not the railway's scores."] },
        { h: "6. Changes", p: ["Kautilya Classes may change these terms, the packages and the prices. Changes apply from the date they are posted here; a package already bought keeps the validity it was bought with."] },
        { h: "7. Contact", p: ["Questions about these terms: WhatsApp +91 99822 22301, Kautilya Classes."] },
      ]}
    />
  );
}
