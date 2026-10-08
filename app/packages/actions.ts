"use server";

import { requireUser } from "@/lib/auth";
import { loadPackage } from "@/lib/packages";
import { createOrder, loadOrder, setGatewayOrder, settlePaidOrder } from "@/lib/orders";
import { createRazorpayOrder, razorpayConfigured, razorpayKeyId, verifyPaymentSignature } from "@/lib/razorpay";
import { logAction } from "@/lib/audit";

export type CheckoutStart =
  | { ok: true; orderId: string; gatewayOrderId: string; amountInr: number; keyId: string; name: string; phone: string; packageName: string }
  | { ok: false; error: string };

/** Makes the order, here and at Razorpay, and hands the checkout what it needs. */
export async function startCheckout(slug: string): Promise<CheckoutStart> {
  const who = await requireUser(`/packages`);
  if (!razorpayConfigured()) return { ok: false, error: "Online payment is not switched on yet. Pay at the office or on WhatsApp." };
  const pkg = await loadPackage(slug);
  if (!pkg || !pkg.isPublished) return { ok: false, error: "This package is not on sale." };
  if (pkg.priceInr <= 0) return { ok: false, error: "This package is free; ask at the institute to add it." };
  try {
    const order = await createOrder(who.id, pkg);
    const gw = await createRazorpayOrder(pkg.priceInr, order.id, { package: pkg.slug, user: who.id, phone: who.phone });
    await setGatewayOrder(order.id, gw.id);
    return {
      ok: true,
      orderId: order.id,
      gatewayOrderId: gw.id,
      amountInr: pkg.priceInr,
      keyId: razorpayKeyId() as string,
      name: who.full_name,
      phone: who.phone,
      packageName: pkg.name,
    };
  } catch (error) {
    console.error("startCheckout", error);
    return { ok: false, error: "Could not start the payment. Try again in a moment, or pay at the office." };
  }
}

export type CheckoutDone = { ok: true } | { ok: false; error: string };

/** The checkout says the payment went through: check its signature, then give the package. */
export async function finishCheckout(input: { orderId: string; gatewayOrderId: string; paymentId: string; signature: string }): Promise<CheckoutDone> {
  const who = await requireUser(`/packages`);
  const order = await loadOrder(input.orderId);
  if (!order || order.userId !== who.id) return { ok: false, error: "This order is not yours." };
  if (order.gatewayOrderId !== input.gatewayOrderId) return { ok: false, error: "The order does not match." };
  if (!verifyPaymentSignature(input.gatewayOrderId, input.paymentId, input.signature)) {
    return { ok: false, error: "The payment could not be verified. If money was taken, it is settled automatically within a few minutes; ask at the office otherwise." };
  }
  try {
    await settlePaidOrder(order, input.paymentId);
    await logAction("Package bought", `${who.full_name} (${who.phone}) · order ${order.id}`).catch(() => {});
    return { ok: true };
  } catch (error) {
    console.error("finishCheckout", error);
    return { ok: false, error: "Paid, but the package could not be added. Ask at the office with your payment id." };
  }
}
