import { NextResponse } from "next/server";
import { loadOrderByGatewayId, settlePaidOrder } from "@/lib/orders";
import { verifyWebhookSignature } from "@/lib/razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Razorpay calls this when a payment is captured. The checkout in the
 * browser normally settles the order first; this is the safety net for a
 * student whose browser closed before it could, and it does the same
 * thing once more (which does nothing the second time).
 */
export async function POST(request: Request): Promise<Response> {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) return NextResponse.json({ ok: false }, { status: 400 });

  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (event.event !== "payment.captured" && event.event !== "order.paid") return NextResponse.json({ ok: true, ignored: true });

  const payment = event.payload?.payment?.entity;
  if (!payment?.id || !payment.order_id) return NextResponse.json({ ok: true, ignored: true });
  const order = await loadOrderByGatewayId(payment.order_id);
  if (!order) return NextResponse.json({ ok: true, unknown: true });
  try {
    await settlePaidOrder(order, payment.id);
  } catch (error) {
    console.error("razorpay webhook", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
