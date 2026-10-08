import type { Metadata } from "next";
import { PolicyPage } from "@/components/landing/PolicyPage";

export const metadata: Metadata = { title: "Refund & Cancellation Policy | Kautilya Classes Railway Psycho Test Portal", robots: { index: true, follow: true } };

export default function RefundPage() {
  return (
    <PolicyPage
      title="Refund & Cancellation Policy"
      titleHi="रिफंड और रद्दीकरण नीति"
      updated="8 October 2026"
      sections={[
        { h: "Try before you buy", p: ["Every account gets one free Full Mock Test, so you can see the test screen, the timing and the scoring before paying for a package."] },
        { h: "Refunds", p: ["A package is a digital service that opens the moment payment is received. Once a package is active, the payment is not refundable, except as below."] },
        { h: "When a refund is given", p: ["Money was taken but the package was not added to your account within 24 hours, and the institute could not add it: full refund.", "The same package was paid for twice by mistake: the second payment is refunded in full.", "Refunds go back to the payment method used, through Razorpay, within 7 working days of approval."] },
        { h: "Cancellation", p: ["An order that was started but not paid is cancelled automatically; nothing is charged."] },
        { h: "How to ask", p: ["WhatsApp +91 99822 22301 with your mobile number and the Razorpay payment id, within 7 days of the payment."] },
      ]}
    />
  );
}
