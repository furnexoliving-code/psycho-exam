import { createAdminClient } from "@/lib/supabase/admin";
import { grantEnrollment, loadPackage, type Package } from "@/lib/packages";

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
}

const COLUMNS = "id, user_id, package_id, amount_inr, status, gateway_order_id, gateway_payment_id, created_at, paid_at";

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
  };
}

/** Records a purchase about to be paid. */
export async function createOrder(userId: string, pkg: Package): Promise<Order> {
  const { data, error } = await createAdminClient()
    .from("orders")
    .insert({ user_id: userId, package_id: pkg.id, amount_inr: pkg.priceInr, status: "created" })
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
  await grantEnrollment(order.userId, pkg, { source: "purchase", orderId: order.id, note: `Paid online · ${paymentId}` });
}

/** Every order, newest first, with the student's name and the package, for the panel. */
export async function listOrders(limit = 200): Promise<(Order & { studentName: string; phone: string; packageName: string })[]> {
  const { data, error } = await createAdminClient()
    .from("orders")
    .select(`${COLUMNS}, profile:profiles(full_name, phone), package:packages(name)`)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as unknown as (OrderRow & { profile: { full_name: string; phone: string } | null; package: { name: string } | null })[]).map((r) => ({
    ...toOrder(r),
    studentName: r.profile?.full_name ?? "",
    phone: r.profile?.phone ?? "",
    packageName: r.package?.name ?? "",
  }));
}
