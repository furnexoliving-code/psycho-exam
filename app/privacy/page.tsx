import type { Metadata } from "next";
import { PolicyPage } from "@/components/landing/PolicyPage";

export const metadata: Metadata = { title: "Privacy Policy | Kautilya Classes Railway Psycho Test Portal", robots: { index: true, follow: true } };

export default function PrivacyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      titleHi="गोपनीयता नीति"
      updated="8 October 2026"
      sections={[
        { h: "What we collect", p: ["Your name and mobile number (to make and sign in to your account), a photo if you upload one (shown on your test screen, as the exam hall does), your answers, scores and results, and the device and time of sign-in (to keep one account on one device)."] },
        { h: "What we use it for", p: ["To run the Portal: open your tests, score them, show your results and your progress, and let the institute support you. To contact you about your account, your packages and the tests. Nothing is sold or passed to advertisers."] },
        { h: "Payments", p: ["Payments are processed by Razorpay. Your card, UPI or bank details go to Razorpay and are never stored by Kautilya Classes. We keep the order, the amount and Razorpay's payment id."] },
        { h: "Where it is kept", p: ["Data is stored with Supabase (servers in Mumbai, India) and served through Vercel. It is kept while your account exists; ask the institute to delete your account and its data."] },
        { h: "Cookies", p: ["The Portal uses only the cookies it needs to keep you signed in and to recognise your device. No advertising cookies."] },
        { h: "Contact", p: ["Questions about your data: WhatsApp +91 99822 22301, Kautilya Classes."] },
      ]}
    />
  );
}
