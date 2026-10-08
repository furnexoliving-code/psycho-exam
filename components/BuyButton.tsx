"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { finishCheckout, startCheckout } from "@/app/packages/actions";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, handler: (r: unknown) => void) => void };
  }
}

function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("checkout.js"));
    document.body.appendChild(s);
  });
}

/** Buys a package: opens Razorpay's checkout, then confirms the payment on the server. */
export function BuyButton({ slug, label, className, coupon = "" }: { slug: string; label: string; className: string; coupon?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    setBusy(true);
    setError(null);
    try {
      const start = await startCheckout(slug, coupon);
      if (!start.ok) {
        setError(start.error);
        return;
      }
      await loadCheckout();
      if (!window.Razorpay) throw new Error("checkout");
      const rzp = new window.Razorpay({
        key: start.keyId,
        amount: Math.round(start.amountInr * 100),
        currency: "INR",
        name: "Kautilya Classes",
        description: start.packageName,
        order_id: start.gatewayOrderId,
        prefill: { name: start.name, contact: start.phone },
        theme: { color: "#0d2a6b" },
        handler: async (r: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          const done = await finishCheckout({
            orderId: start.orderId,
            gatewayOrderId: r.razorpay_order_id,
            paymentId: r.razorpay_payment_id,
            signature: r.razorpay_signature,
          });
          if (done.ok) {
            router.push("/packages?paid=1");
            router.refresh();
          } else {
            setError(done.error);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on("payment.failed", () => setError("The payment did not go through. Nothing was charged; try again."));
      rzp.open();
    } catch {
      setError("Could not open the payment window. Check the connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={buy} disabled={busy} className={className}>
        {busy ? "Opening payment…" : label}
      </button>
      {error && <p role="alert" className="mt-2 text-[12px] text-red-700">{error}</p>}
    </div>
  );
}
