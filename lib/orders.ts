import { createAdminClient } from "@/lib/supabase/admin";
import { grantEnrollment, loadPackage, type Package } from "@/lib/packages";
import { countCouponUse } from "@/lib/coupons";

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
 * twice (the checkout's handler and the webhook both do): the second
 * call finds the order already paid and does nothing.
 */
export async function settlePaidOrder(order: Order, paymentId: string): Promise<void> {
  if (order.status === "paid") return;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "paid", gateway_payment_id: paymentId, paid_at: new Date().toISOString() })
    .eq("id", order.id)
    .eq("status", "created")
    .select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) return; // the other caller got there first
  const { data: row } = await supabase.from("packages").select("slug").eq("id", order.packageId).single();
  const pkg = row ? await loadPackage(row.slug as string) : null;
  if (!pkg) throw new Error("The package of this order no longer exists");
  await grantEnrollment(order.userId, pkg, { source: "purchase", orderId: order.id, note: `Paid online · ${paymentId}${order.couponCode ? ` · code ${order.couponCode}` : ""}` });
  if (order.couponCode) await countCouponUse(order.couponCode);
}

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
