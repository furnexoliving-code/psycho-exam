import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Razorpay, the payment gateway. Three secrets live in the environment:
 * the key id (public, goes to the browser's checkout), the key secret
 * (server only: makes orders and checks a payment's signature) and the
 * webhook secret (server only: checks a webhook's signature). Without
 * the first two, online payment is simply not offered and the packages
 * page says to pay at the office.
 */
export function razorpayKeyId(): string | null {
  return process.env.RAZORPAY_KEY_ID?.trim() || null;
}

export function razorpayConfigured(): boolean {
  return Boolean(razorpayKeyId() && process.env.RAZORPAY_KEY_SECRET?.trim());
}

/** Makes an order at Razorpay; the id comes back for the checkout. Amount in rupees. */
/** How long a call to Razorpay may take before it counts as failed: a stalled gateway must never hold a page. */
export const GATEWAY_TIMEOUT_MS = 8000;

export async function createRazorpayOrder(amountInr: number, receipt: string, notes: Record<string, string>): Promise<{ id: string }> {
  const keyId = razorpayKeyId();
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !secret) throw new Error("Razorpay is not configured");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${keyId}:${secret}`).toString("base64")}`,
    },
    body: JSON.stringify({ amount: Math.round(amountInr * 100), currency: "INR", receipt, notes }),
    cache: "no-store",
    signal: AbortSignal.timeout(GATEWAY_TIMEOUT_MS),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Razorpay refused the order (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { id: string };
  return { id: data.id };
}

/**
 * Takes the money of an authorised payment. Razorpay only holds the
 * amount at checkout; unless it is captured, by this call or by the
 * account's auto-capture setting, it goes back to the card in a few
 * days. "Already captured" counts as done.
 */
export async function captureRazorpayPayment(paymentId: string, amountInr: number): Promise<"captured" | "already"> {
  const keyId = razorpayKeyId();
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !secret) throw new Error("Razorpay is not configured");
  const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/capture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${keyId}:${secret}`).toString("base64")}`,
    },
    body: JSON.stringify({ amount: Math.round(amountInr * 100), currency: "INR" }),
    cache: "no-store",
    signal: AbortSignal.timeout(GATEWAY_TIMEOUT_MS),
  });
  if (res.ok) return "captured";
  const text = await res.text().catch(() => "");
  if (/already been captured|already captured/i.test(text)) return "already";
  throw new Error(`Razorpay refused the capture (${res.status}): ${text.slice(0, 200)}`);
}

/** A payment as Razorpay lists it against one of our orders; the amount is in paise. */
export interface GatewayPayment {
  id: string;
  status: string;
  amount: number;
}

/**
 * The payments Razorpay holds against one of our orders. Asked when the
 * checkout's own word cannot be acted on: a capture call refused, or a
 * student back on the page after closing the tab mid-payment.
 */
export async function listRazorpayOrderPayments(gatewayOrderId: string, timeoutMs = GATEWAY_TIMEOUT_MS): Promise<GatewayPayment[]> {
  const keyId = razorpayKeyId();
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !secret) throw new Error("Razorpay is not configured");
  const res = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(gatewayOrderId)}/payments`, {
    headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${secret}`).toString("base64")}` },
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Razorpay refused the payment list (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { items?: { id?: unknown; status?: unknown; amount?: unknown }[] };
  return (data.items ?? [])
    .filter((p) => typeof p.id === "string" && typeof p.status === "string")
    .map((p) => ({ id: p.id as string, status: p.status as string, amount: Number(p.amount) }));
}

/**
 * The payment that took the order's money, if Razorpay holds one: captured,
 * and for the amount the order was made for (a Razorpay order fixes its
 * amount, so anything else is not this order's).
 */
export function capturedPayment(payments: GatewayPayment[], amountInr: number): GatewayPayment | null {
  const paise = Math.round(amountInr * 100);
  return payments.find((p) => p.status === "captured" && p.amount === paise) ?? null;
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** True when the checkout's payment really is Razorpay's: HMAC of "order|payment" with the key secret. */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqual(expected, signature);
}

/** True when a webhook body was signed with the webhook secret. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}
