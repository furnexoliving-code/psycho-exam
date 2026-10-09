import { SaveForm } from "@/components/admin/SaveForm";
import { RowForm } from "@/components/admin/RowForm";
import { PendingButton } from "@/components/admin/PendingButton";
import { NO_PACKAGE, type Package } from "@/lib/packages";
import { createStudent, givePackageToAll } from "./actions";
import { BulkStudents } from "./BulkStudents";

/**
 * The top of the Students page: one account, many accounts, and the
 * package every new account starts with. Above them, when any switched-on
 * student has no package at all, the one button that gives it to them.
 */
export function Admissions({
  packages,
  defaultSlug,
  missing,
}: {
  packages: Package[];
  defaultSlug: string;
  /** Students with no package, oldest first. */
  missing: { id: string; fullName: string }[];
}) {
  const starter = packages.find((p) => p.slug === defaultSlug) ?? null;
  return (
    <>
      {missing.length > 0 && starter && (
        <section className="mt-4 flex flex-wrap items-center gap-3 rounded border border-amber-300 bg-amber-50 p-4">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-amber-900">
              {missing.length} student{missing.length === 1 ? " has" : "s have"} no package, so their Practice and Full Mocks are locked.
            </p>
            <p className="mt-0.5 text-[12px] text-amber-800">
              {missing.slice(0, 6).map((m) => m.fullName).join(", ")}{missing.length > 6 ? ` and ${missing.length - 6} more` : ""}.
              One click gives each of them {starter.name}, till the account&apos;s validity date or without expiry.
            </p>
          </div>
          <RowForm action={givePackageToAll}>
            <PendingButton
              pendingLabel="Giving…"
              confirm={`Give ${starter.name} to all ${missing.length} student${missing.length === 1 ? "" : "s"} without a package?`}
              className="rounded bg-indigo-800 px-5 py-2 text-[13px] font-semibold text-white hover:bg-indigo-900 disabled:opacity-60"
            >
              Give {starter.name} to all {missing.length}
            </PendingButton>
          </RowForm>
        </section>
      )}

      <section className="mt-4 rounded border border-gray-300 bg-white p-5">
        <h2 className="text-[15px] font-bold text-gray-900">Add a student</h2>
        <p className="mt-1 text-[12px] text-gray-600">
          Students cannot sign themselves up. Give them the mobile number and
          password you set here — that is how they sign in.
        </p>

        <SaveForm
          action={createStudent}
          submitLabel="Create the account"
          className="mt-3"
        >
          <div className="grid gap-3 sm:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Name</span>
            <input name="full_name" required className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Mobile number</span>
            <input
              name="phone"
              required
              inputMode="numeric"
              placeholder="10 digits"
              className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Password</span>
            <input
              name="password"
              required
              minLength={6}
              placeholder="at least 6 characters"
              className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Package</span>
            <select name="package" defaultValue={defaultSlug} className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]">
              {packages.map((p) => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
              <option value={NO_PACKAGE}>No package</option>
            </select>
            <span className="mt-1 block text-[11px] text-gray-500">Given with the account; runs till the account&apos;s validity date, else without expiry.</span>
          </label>
          </div>
        </SaveForm>
      </section>

      <BulkStudents packages={packages.map((p) => ({ slug: p.slug, name: p.name }))} defaultSlug={defaultSlug} />
    </>
  );
}
