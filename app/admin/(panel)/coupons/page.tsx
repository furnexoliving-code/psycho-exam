import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format-time";
import { couponProblem, listCoupons } from "@/lib/coupons";
import { listAllPackages, rupees } from "@/lib/packages";
import { SaveForm } from "@/components/admin/SaveForm";
import { RowForm } from "@/components/admin/RowForm";
import { createCoupon, setCouponActive } from "./actions";

const field = "w-full rounded border border-gray-400 px-3 py-2 text-[13px]";

export default async function CouponsPage() {
  await requireAdmin("/admin/coupons");
  const [coupons, packages] = await Promise.all([listCoupons(), listAllPackages()]);
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">Coupon codes</h1>
        <Link href="/admin/packages" className="ml-auto text-[13px] font-semibold text-rrb-banner hover:underline">← Packages</Link>
      </div>
      <p className="mt-1 text-[13px] text-gray-600">
        A code a student types on the packages page for a discount. Launch offers, festival offers, a batch code, a code for one package only. A code counts a use when its order is paid.
      </p>

      <table className="mt-4 w-full border-collapse text-[13px]">
        <thead>
          <tr className="bg-gray-100 text-left text-gray-700">
            <th className="border border-gray-300 px-3 py-2">Code</th>
            <th className="border border-gray-300 px-3 py-2">Discount</th>
            <th className="border border-gray-300 px-3 py-2">On</th>
            <th className="border border-gray-300 px-3 py-2">Used</th>
            <th className="border border-gray-300 px-3 py-2">Expires</th>
            <th className="border border-gray-300 px-3 py-2">Status</th>
            <th className="border border-gray-300 px-3 py-2">Note</th>
          </tr>
        </thead>
        <tbody>
          {coupons.length === 0 && <tr><td colSpan={7} className="border border-gray-300 px-3 py-6 text-center text-gray-500">No codes yet. Run supabase/coupons.sql once, then add one below.</td></tr>}
          {coupons.map((c) => {
            const problem = couponProblem(c);
            return (
              <tr key={c.id} className="bg-white even:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2 font-mono font-bold">{c.code}</td>
                <td className="border border-gray-300 px-3 py-2">{c.kind === "percent" ? `${c.value}% off` : `${rupees(c.value)} off`}</td>
                <td className="border border-gray-300 px-3 py-2">{c.packageSlug ?? "Any package"}</td>
                <td className="border border-gray-300 px-3 py-2 tabular-nums">{c.usedCount}{c.maxUses !== null ? ` / ${c.maxUses}` : ""}</td>
                <td className="border border-gray-300 px-3 py-2">{c.expiresAt ? formatDate(c.expiresAt) : "—"}</td>
                <td className="border border-gray-300 px-3 py-2">
                  <RowForm action={setCouponActive}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="active" value={String(!c.isActive)} />
                    <button type="submit" className={`rounded px-2 py-0.5 text-[11px] font-semibold ${!c.isActive ? "bg-gray-200 text-gray-700" : problem ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}>
                      {!c.isActive ? "Off — switch on" : problem ? `${problem.replace(/\.$/, "")} — switch off` : "On — switch off"}
                    </button>
                  </RowForm>
                </td>
                <td className="border border-gray-300 px-3 py-2 text-gray-600">{c.note}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <SaveForm action={createCoupon} submitLabel="Add the code" className="mt-8 rounded border border-gray-300 bg-white p-5">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-gray-500">New code</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block"><span className="mb-1 block text-[12px] font-semibold text-gray-700">Code</span><input name="code" required placeholder="KAUTILYA100" className={`${field} uppercase`} /></label>
          <label className="block"><span className="mb-1 block text-[12px] font-semibold text-gray-700">Kind</span><select name="kind" className={field}><option value="percent">Percent off</option><option value="amount">Rupees off</option></select></label>
          <label className="block"><span className="mb-1 block text-[12px] font-semibold text-gray-700">Value</span><input name="value" type="number" min={1} required placeholder="20 (%) or 100 (₹)" className={field} /></label>
          <label className="block"><span className="mb-1 block text-[12px] font-semibold text-gray-700">Only on</span><select name="package_slug" className={field}><option value="">Any package</option>{packages.map((p) => <option key={p.id} value={p.slug}>{p.name}</option>)}</select></label>
          <label className="block"><span className="mb-1 block text-[12px] font-semibold text-gray-700">Max uses (blank: no limit)</span><input name="max_uses" type="number" min={1} className={field} /></label>
          <label className="block"><span className="mb-1 block text-[12px] font-semibold text-gray-700">Expires on (blank: never)</span><input name="expires_on" type="date" className={field} /></label>
          <label className="block sm:col-span-2"><span className="mb-1 block text-[12px] font-semibold text-gray-700">Note (for you)</span><input name="note" placeholder="Launch offer, October" className={field} /></label>
        </div>
      </SaveForm>
    </>
  );
}
