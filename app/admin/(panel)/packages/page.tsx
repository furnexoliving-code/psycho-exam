import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll } from "@/lib/wt/cohort";
import { KIND_LABEL, listAllPackages, rupees } from "@/lib/packages";
import { paymentsSummary } from "@/lib/payments";
import { SaveForm } from "@/components/admin/SaveForm";
import { PackageFields } from "./PackageFields";
import { createPackage } from "./actions";

export default async function PackagesAdminPage() {
  await requireAdmin("/admin/packages");
  const [packages, payments] = await Promise.all([listAllPackages(), paymentsSummary()]);
  // How many students hold each package, in one read.
  const supabase = createAdminClient();
  const rows = await fetchAll<{ package_id: string; expires_at: string | null }>((from, to) => supabase.from("enrollments").select("package_id, expires_at").order("id").range(from, to));
  const holders = new Map<string, { all: number; active: number }>();
  for (const r of rows) {
    const h = holders.get(r.package_id) ?? { all: 0, active: 0 };
    h.all++;
    if (!r.expires_at || new Date(r.expires_at as string).getTime() > Date.now()) h.active++;
    holders.set(r.package_id, h);
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">Packages</h1>
        <Link href="/admin/coupons" className="ml-auto rounded border border-gray-400 bg-white px-4 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100">Coupon codes</Link>
        <Link href="/admin/orders" className=" rounded border border-gray-400 bg-white px-4 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100">Orders & payments</Link>
        <Link href="/packages" target="_blank" className="rounded border border-gray-400 bg-white px-4 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100">See the packages page ↗</Link>
      </div>
      <p className="mt-1 text-[13px] text-gray-600">
        What a student buys, or the institute gives: sectional tests, Full Mock Tests, or both, for one exam&apos;s series.
        A student sees only what their packages open; the free mock (ticked on the mock itself) is open to everyone.
      </p>
      <p className={`mt-3 rounded border px-4 py-2 text-[12px] ${payments.tone === "ok" ? "border-green-300 bg-green-50 text-green-800" : payments.tone === "warn" ? "border-amber-300 bg-amber-50 text-amber-900" : "border-gray-300 bg-gray-50 text-gray-700"}`}>
        {payments.text} <Link href="/admin/team#payments" className="font-semibold underline">Payment settings</Link>
      </p>

      <table className="mt-5 w-full border-collapse text-[13px]">
        <thead>
          <tr className="bg-gray-100 text-left text-gray-700">
            <th className="border border-gray-300 px-3 py-2">Package</th>
            <th className="border border-gray-300 px-3 py-2">Exam</th>
            <th className="border border-gray-300 px-3 py-2">Opens</th>
            <th className="border border-gray-300 px-3 py-2">Price</th>
            <th className="border border-gray-300 px-3 py-2">Validity</th>
            <th className="border border-gray-300 px-3 py-2">Students</th>
            <th className="border border-gray-300 px-3 py-2">On sale</th>
          </tr>
        </thead>
        <tbody>
          {packages.length === 0 && (
            <tr><td colSpan={7} className="border border-gray-300 px-3 py-6 text-center text-gray-500">No packages yet. Run supabase/packages.sql, or add one below.</td></tr>
          )}
          {packages.map((p) => {
            const h = holders.get(p.id) ?? { all: 0, active: 0 };
            return (
              <tr key={p.id} className="bg-white even:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2 font-semibold">
                  <Link href={`/admin/packages/${p.slug}`} className="text-rrb-banner hover:underline">{p.name}</Link>
                  <span className="block text-[11px] font-normal text-gray-500">{p.slug}</span>
                </td>
                <td className="border border-gray-300 px-3 py-2 uppercase">{p.exam}</td>
                <td className="border border-gray-300 px-3 py-2">{KIND_LABEL[p.kind]}</td>
                <td className="border border-gray-300 px-3 py-2 tabular-nums">{rupees(p.priceInr)}{p.mrpInr ? <span className="ml-1 text-[11px] text-gray-400 line-through">{rupees(p.mrpInr)}</span> : null}</td>
                <td className="border border-gray-300 px-3 py-2">{p.validityDays ? `${p.validityDays} days` : "No expiry"}</td>
                <td className="border border-gray-300 px-3 py-2 tabular-nums">{h.active} active{h.all !== h.active ? ` · ${h.all - h.active} expired` : ""}</td>
                <td className="border border-gray-300 px-3 py-2">
                  <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${p.isPublished ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}>{p.isPublished ? "On sale" : "Hidden"}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <SaveForm action={createPackage} submitLabel="Add the package" className="mt-8 rounded border border-gray-300 bg-white p-5">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-gray-500">New package</h2>
        <div className="mt-3">
          <PackageFields />
        </div>
      </SaveForm>
    </>
  );
}
