import { SaveForm } from "@/components/admin/SaveForm";
import { KIND_LABEL, type Package } from "@/lib/packages";
import { givePackageBulk } from "./actions";

/**
 * One package to many students: a pasted list of mobile numbers, and
 * nothing else. The list's filter is deliberately not an option here: a
 * form that could hand a package to "everyone in the current filter"
 * would, with the filter on All, give it to every student on one click.
 */
export function BulkGrant({ packages, open = false }: { packages: Package[]; open?: boolean }) {
  if (packages.length === 0) return null;
  return (
    <details className="mt-3 rounded border border-indigo-200 bg-indigo-50/60 p-4" open={open}>
      <summary className="cursor-pointer text-[14px] font-bold text-gray-900">
        Give a package to many students at once <span className="font-normal text-gray-500">— by pasting their mobile numbers</span>
      </summary>
      <SaveForm action={givePackageBulk} submitLabel="Give the package" className="mt-3">
        <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr]">
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Package</span>
            <select name="package" required className="w-full rounded border border-gray-400 bg-white px-3 py-2 text-[13px]">
              {packages.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name} · {KIND_LABEL[p.kind]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Till (blank: account validity, else no expiry)</span>
            <input name="expires_on" type="date" className="w-full rounded border border-gray-400 bg-white px-3 py-2 text-[13px]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Note</span>
            <input name="note" placeholder="Batch of Oct 2026" className="w-full rounded border border-gray-400 bg-white px-3 py-2 text-[13px]" />
          </label>
        </div>
        <label className="mt-3 block text-[13px] text-gray-800">
          <b>Mobile numbers</b> (paste from Excel or WhatsApp, one per line or comma-separated)
          <textarea name="numbers" rows={4} required placeholder={"9876543210\n9876543211"} className="mt-1 block w-full max-w-md rounded border border-gray-400 bg-white px-3 py-2 font-mono text-[12px]" />
        </label>
        <p className="mt-2 text-[11px] text-gray-500">Only the numbers pasted here get the package. A student who already holds it is left as they are and not counted; the result says how many were given and which numbers have no account.</p>
      </SaveForm>
    </details>
  );
}
