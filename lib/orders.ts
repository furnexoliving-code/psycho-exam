import { createAdminClient } from "@/lib/supabase/admin";
import { grantEnrollment, loadPackage, type Package } from "@/lib/packages";
import { countCouponUse } from "@/lib/coupons";
import { capturedPayment, listRazorpayOrderPayments } from "@/lib/razorpay";

export interface Order {
  id: string;
  userId: string;
  packageId: string;
  amountInr: number;
  status: "created" | "paid" | "failed";
  gatewayOrderId: string | null;
  gatewayPaymentId: string | null;
  createdAt: string;
  paidAt: string | null;
  couponCode: string | null;
  discountInr: number;
}

interface OrderRow {
  id: string;
  user_id: string;
  package_id: string;
  amount_inr: number;
  status: "created" | "paid" | "failed";
  gateway_order_id: string | null;
  gateway_payment_id: string | null;
  created_at: string;
  paid_at: string | null;
  coupon_code?: string | null;
  discount_inr?: number | null;
}

const COLUMNS = "id, user_id, package_id, amount_inr, status, gateway_order_id, gateway_payment_id, created_at, paid_at, coupon_code, discount_inr";

function toOrder(r: OrderRow): Order {
  return {
    id: r.id,
    userId: r.user_id,
    packageId: r.package_id,
    amountInr: Number(r.amount_inr),
    status: r.status,
    gatewayOrderId: r.gateway_order_id,
    gatewayPaymentId: r.gateway_payment_id,
    createdAt: r.created_at,
    paidAt: r.paid_at,
    couponCode: r.coupon_code ?? null,
    discountInr: Number(r.discount_inr ?? 0),
  };
}

/** Records a purchase about to be paid, at the price after any code. */
export async function createOrder(userId: string, pkg: Package, price: { amountInr: number; couponCode: string | null; discountInr: number }): Promise<Order> {
  const { data, error } = await createAdminClient()
    .from("orders")
    .insert({ user_id: userId, package_id: pkg.id, amount_inr: price.amountInr, status: "created", coupon_code: price.couponCode, discount_inr: price.discountInr })
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toOrder(data as OrderRow);
}

export async function setGatewayOrder(orderId: string, gatewayOrderId: string): Promise<void> {
  const { error } = await createAdminClient().from("orders").update({ gateway_order_id: gatewayOrderId }).eq("id", orderId);
  if (error) throw new Error(error.message);
}

export async function loadOrder(orderId: string): Promise<Order | null> {
  const { data, error } = await createAdminClient().from("orders").select(COLUMNS).eq("id", orderId).maybeSingle();
  if (error || !data) return null;
  return toOrder(data as OrderRow);
}

export async function loadOrderByGatewayId(gatewayOrderId: string): Promise<Order | null> {
  const { data, error } = await createAdminClient().from("orders").select(COLUMNS).eq("gateway_order_id", gatewayOrderId).maybeSingle();
  if (error || !data) return null;
  return toOrder(data as OrderRow);
}

/**
 * Marks an order paid and gives the student the package. Safe to call
 * twice (the checkout's handler, the webhook and the packages page all
 * may): the second call finds the order already paid and does nothing.
 * Marking it paid first is the lock between them; should the grant then
 * fail, the mark is taken back so the next caller can try again, and
 * the student is never left "paid" without the package.
 */
export async function settlePaidOrder(order: Order, paymentId: string): Promise<void> {
  if (order.status === "paid") return;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "paid", gateway_payment_id: paymentId, paid_at: new Date().toISOString() })
    .eq("id", order.id)
    .neq("status", "paid")
    .select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) return; // the other caller got there first
  try {
    const { data: row } = await supabase.from("packages").select("slug").eq("id", order.packageId).single();
    const pkg = row ? await loadPackage(row.slug as string) : null;
    if (!pkg) throw new Error("The package of this order no longer exists");
    await grantEnrollment(order.userId, pkg, { source: "purchase", orderId: order.id, note: `Paid online · ${paymentId}${order.couponCode ? ` · code ${order.couponCode}` : ""}` });
  } catch (failure) {
    // The grant may have landed with its reply lost: then the mark stands.
    const { data: granted } = await supabase.from("enrollments").select("id").eq("order_id", order.id).limit(1);
    if (granted?.length) return;
    const { error: undo } = await supabase.from("orders").update({ status: "created", gateway_payment_id: null, paid_at: null }).eq("id", order.id).eq("status", "paid");
    if (undo) console.error("settlePaidOrder: could not take back the paid mark", order.id, undo.message);
    throw failure;
  }
  if (order.couponCode) await countCouponUse(order.couponCode);
}

/**
 * Settles an order whose money Razorpay has already taken, on Razorpay's
 * own word rather than the browser's. The safety net for a checkout whose
 * capture call was refused (a UPI payment is captured by Razorpay itself
 * the moment the bank approves, and the call then has nothing left to do)
 * and for a student who closed the tab before the handler ran. True when
 * the order is paid afterwards; false when Razorpay holds no captured
 * payment for it yet (an authorised card payment is captured within
 * minutes, and the webhook or the next visit here settles it).
 */
export async function settleFromGateway(order: Order, timeoutMs?: number): Promise<boolean> {
  if (order.status === "paid") return true;
  if (!order.gatewayOrderId) return false;
  const payments = await listRazorpayOrderPayments(order.gatewayOrderId, timeoutMs);
  const captured = capturedPayment(payments, order.amountInr);
  if (captured) {
    await settlePaidOrder(order, captured.id);
    return true;
  }
  // A checkout closed without paying, or whose every attempt failed, is
  // marked so after an hour and asked about for one more day only (see
  // pendingOrdersOf), in case its window was still open and paid late.
  // A payment still in flight keeps the order waiting as it is.
  const over = order.status === "created" && Date.now() - Date.parse(order.createdAt) > ABANDONED_AFTER_MS && payments.every((p) => p.status === "failed");
  if (over) await createAdminClient().from("orders").update({ status: "failed" }).eq("id", order.id).eq("status", "created");
  return false;
}

const ABANDONED_AFTER_MS = 60 * 60 * 1000;

/**
 * A student's orders still waiting on their payment, oldest first: those
 * of the last thirty days that reached Razorpay, and those given up on
 * (status "failed") in the last day, whose checkout might yet have been
 * paid late.
 */
export async function pendingOrdersOf(userId: string, limit = 20): Promise<Order[]> {
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const sinceFailed = new Date(Date.now() - 86400000).toISOString();
  const { data, error } = await createAdminClient()
    .from("orders")
    .select(COLUMNS)
    .eq("user_id", userId)
    .or(`status.eq.created,and(status.eq.failed,created_at.gte.${sinceFailed})`)
    .not("gateway_order_id", "is", null)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error || !data) return [];
  return (data as OrderRow[]).map(toOrder);
}

/**
 * Gives a student what they have paid for, if a recent order of theirs
 * was settled at Razorpay but not here. Run when they open the packages
 * page; nothing to do for almost everyone, one short Razorpay call per
 * pending order otherwise, all at once. Never throws: the page must open
 * regardless, and a slow gateway costs it a few seconds at most.
 */
export async function reconcilePendingOrders(userId: string): Promise<number> {
  try {
    const orders = await pendingOrdersOf(userId);
    const results = await Promise.allSettled(orders.map((order) => settleFromGateway(order, RECONCILE_TIMEOUT_MS)));
    results.forEach((r, i) => {
      if (r.status === "rejected") console.error("reconcilePendingOrders", orders[i].id, r.reason);
    });
    return results.filter((r) => r.status === "fulfilled" && r.value).length;
  } catch (error) {
    console.error("reconcilePendingOrders", error);
    return 0;
  }
}

const RECONCILE_TIMEOUT_MS = 4000;

/** Every order, newest first, with the student's name and the package, for the panel. */
export async function listOrders(limit = 200): Promise<(Order & { studentName: string; phone: string; packageName: string })[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("orders").select(COLUMNS).order("created_at", { ascending: false }).limit(limit);
  if (error || !data?.length) return [];
  const rows = data as OrderRow[];
  // Names and packages in two reads of their own: an order points at the
  // auth user, not the profile, so the database cannot join the two for us.
  const [{ data: people }, { data: packages }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, phone").in("id", [...new Set(rows.map((r) => r.user_id))]),
    supabase.from("packages").select("id, name").in("id", [...new Set(rows.map((r) => r.package_id))]),
  ]);
  const who = new Map((people ?? []).map((p) => [p.id as string, p as { full_name: string | null; phone: string | null }]));
  const what = new Map((packages ?? []).map((p) => [p.id as string, p as { name: string | null }]));
  return rows.map((r) => ({
    ...toOrder(r),
    studentName: who.get(r.user_id)?.full_name ?? "",
    phone: who.get(r.user_id)?.phone ?? "",
    packageName: what.get(r.package_id)?.name ?? "",
  }));
}
