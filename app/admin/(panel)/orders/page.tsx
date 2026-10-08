import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format-time";
import { listOrders } from "@/lib/orders";
import { rupees } from "@/lib/packages";

export default async function OrdersPage() {
  await requireAdmin("/admin/orders");
  const orders = await listOrders(300);
  const paid = orders.filter((o) => o.status === "paid");
  const total = paid.reduce((s, o) => s + o.amountInr, 0);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">Orders & payments</h1>
        <Link href="/admin/packages" className="ml-auto text-[13px] font-semibold text-rrb-banner hover:underline">← Packages</Link>
      </div>
      <p className="mt-1 text-[13px] text-gray-600">
        Every online purchase. <b>{paid.length}</b> paid · <b>{rupees(total)}</b> collected. A &ldquo;created&rdquo; order is a checkout that was opened but not paid; nothing was charged.
      </p>
      <table className="mt-4 w-full border-collapse text-[12px]">
        <thead>
          <tr className="bg-gray-100 text-left text-gray-700">
            <th className="border border-gray-300 px-2 py-1.5">When</th>
            <th className="border border-gray-300 px-2 py-1.5">Student</th>
            <th className="border border-gray-300 px-2 py-1.5">Package</th>
            <th className="border border-gray-300 px-2 py-1.5">Amount</th>
            <th className="border border-gray-300 px-2 py-1.5">Status</th>
            <th className="border border-gray-300 px-2 py-1.5">Razorpay payment</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 && <tr><td colSpan={6} className="border border-gray-300 px-2 py-6 text-center text-gray-500">No orders yet.</td></tr>}
          {orders.map((o) => (
            <tr key={o.id} className="bg-white even:bg-gray-50">
              <td className="border border-gray-300 px-2 py-1.5">{formatDateTime(o.paidAt ?? o.createdAt)}</td>
              <td className="border border-gray-300 px-2 py-1.5">
                <Link href={`/admin/students/${o.userId}`} className="font-semibold text-rrb-banner hover:underline">{o.studentName || "—"}</Link>
                <span className="block text-gray-500">{o.phone}</span>
              </td>
              <td className="border border-gray-300 px-2 py-1.5">{o.packageName}</td>
              <td className="border border-gray-300 px-2 py-1.5 tabular-nums">{rupees(o.amountInr)}{o.couponCode ? <span className="block text-[10px] text-green-700">{o.couponCode} −{rupees(o.discountInr)}</span> : null}</td>
              <td className="border border-gray-300 px-2 py-1.5">
                <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${o.status === "paid" ? "bg-green-100 text-green-800" : o.status === "failed" ? "bg-red-100 text-red-800" : "bg-gray-200 text-gray-700"}`}>{o.status}</span>
              </td>
              <td className="border border-gray-300 px-2 py-1.5 font-mono text-[11px]">{o.gatewayPaymentId ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
