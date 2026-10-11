import { SaveForm } from "@/components/admin/SaveForm";
import { KIND_LABEL, type Package } from "@/lib/packages";
import { givePackageBulk } from "./actions";
import type { ListFilter } from "./list";

/**
 * One package to many students: everyone the list's filter shows, or a
 * pasted list of mobile numbers. The count is on the button, so the
 * admin sees how many accounts a click touches before it is pressed.
 */
export function BulkGrant({ packages, filter, filterLabel, matchCount }: { packages: Package[]; filter: ListFilter; filterLabel: string; matchCount: number }) {
  if (packages.length === 0) return null;
  return (
    <details className="mt-3 rounded border border-indigo-200 bg-indigo-50/60 p-4" open={filter.pkg === "none" || filter.pkg === "self"}>
      <summary className="cursor-pointer text-[14px] font-bold text-gray-900">
        Give a package to many students at once <span className="font-normal text-gray-500">— the {matchCount.toLocaleString("en-IN")} in the current filter, or pasted mobile numbers</span>
      </summary>
      <SaveForm action={givePackageBulk} submitLabel="Give the package" className="mt-3">
        <input type="hidden" name="q" value={filter.q} />
        <input type="hidden" name="quiet" value={filter.quietDays || ""} />
        <input type="hidden" name="pkg" value={filter.pkg} />
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
        <fieldset className="mt-3">
          <legend className="text-[12px] font-semibold text-gray-700">Who</legend>
          <label className="mt-1 flex items-start gap-2 text-[13px] text-gray-800">
            <input type="radio" name="target" value="filter" defaultChecked className="mt-1" />
            <span>
              <b>Everyone in the current filter</b> — {filterLabel}: <b>{matchCount.toLocaleString("en-IN")}</b> student{matchCount === 1 ? "" : "s"}.
              <span className="block text-[11px] text-gray-500">Change the filter above (No package, a package, self sign-ups, a search, quiet days) and this count follows.</span>
            </span>
          </label>
          <label className="mt-2 flex items-start gap-2 text-[13px] text-gray-800">
            <input type="radio" name="target" value="numbers" className="mt-1" />
            <span className="min-w-0 flex-1">
              <b>These mobile numbers</b> (paste from Excel or WhatsApp, one per line or comma-separated)
              <textarea name="numbers" rows={3} placeholder={"9876543210\n9876543211"} className="mt-1 block w-full max-w-md rounded border border-gray-400 bg-white px-3 py-2 font-mono text-[12px]" />
            </span>
          </label>
        </fieldset>
        <p className="mt-2 text-[11px] text-gray-500">A student who already holds the package is left as they are and not counted. The result says how many were given.</p>
      </SaveForm>
    </details>
  );
}
