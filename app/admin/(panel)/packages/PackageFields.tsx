import { EXAMS, KIND_LABEL, type Package } from "@/lib/packages";

const field = "w-full rounded border border-gray-400 px-3 py-2 text-[13px]";

/** The package form's fields, shared by the new and the edit forms. */
export function PackageFields({ pkg }: { pkg?: Package }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className="block">
        <span className="mb-1 block text-[12px] font-semibold text-gray-700">Name</span>
        <input name="name" required defaultValue={pkg?.name ?? ""} placeholder="ALP Sectional Tests" className={field} />
      </label>
      <label className="block">
        <span className="mb-1 block text-[12px] font-semibold text-gray-700">Name in Hindi</span>
        <input name="name_hi" defaultValue={pkg?.nameHi ?? ""} placeholder="ALP सेक्शनल टेस्ट" className={field} />
      </label>
      {!pkg && (
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-gray-700">Address (slug)</span>
          <input name="slug" placeholder="alp-sectional (blank: from the name)" className={field} />
        </label>
      )}
      <label className="block">
        <span className="mb-1 block text-[12px] font-semibold text-gray-700">Exam</span>
        <select name="exam" defaultValue={pkg?.exam ?? "alp"} className={field}>
          {EXAMS.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-[12px] font-semibold text-gray-700">Opens</span>
        <select name="kind" defaultValue={pkg?.kind ?? "combo"} className={field}>
          {(Object.keys(KIND_LABEL) as (keyof typeof KIND_LABEL)[]).map((k) => (
            <option key={k} value={k}>{KIND_LABEL[k]}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-[12px] font-semibold text-gray-700">Price (₹)</span>
        <input name="price_inr" type="number" min={0} required defaultValue={pkg?.priceInr ?? 0} className={field} />
      </label>
      <label className="block">
        <span className="mb-1 block text-[12px] font-semibold text-gray-700">MRP (₹), shown struck out</span>
        <input name="mrp_inr" type="number" min={0} defaultValue={pkg?.mrpInr ?? ""} placeholder="blank: none" className={field} />
      </label>
      <label className="block">
        <span className="mb-1 block text-[12px] font-semibold text-gray-700">Validity (days from purchase)</span>
        <input name="validity_days" type="number" min={1} defaultValue={pkg?.validityDays ?? ""} placeholder="blank: no expiry" className={field} />
      </label>
      <label className="block">
        <span className="mb-1 block text-[12px] font-semibold text-gray-700">Order in the list</span>
        <input name="sort_order" type="number" defaultValue={pkg?.sortOrder ?? 0} className={field} />
      </label>
      <label className="block sm:col-span-2 lg:col-span-3">
        <span className="mb-1 block text-[12px] font-semibold text-gray-700">Description (shown on the packages page)</span>
        <textarea name="description" rows={2} defaultValue={pkg?.description ?? ""} className={field} />
      </label>
      <label className="flex items-center gap-2 text-[13px] text-gray-800 sm:col-span-2 lg:col-span-3">
        <input type="checkbox" name="is_published" defaultChecked={pkg?.isPublished ?? false} className="h-4 w-4" />
        On sale — shown on the packages page and the front page
      </label>
    </div>
  );
}
