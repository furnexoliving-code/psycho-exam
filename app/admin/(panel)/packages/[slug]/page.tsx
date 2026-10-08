import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { loadPackage } from "@/lib/packages";
import { SaveForm } from "@/components/admin/SaveForm";
import { RowForm } from "@/components/admin/RowForm";
import { PendingButton } from "@/components/admin/PendingButton";
import { PackageFields } from "../PackageFields";
import { deletePackage, savePackage } from "../actions";

export default async function PackageEditor({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireAdmin(`/admin/packages/${slug}`);
  const pkg = await loadPackage(slug);
  if (!pkg) notFound();

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/packages" className="text-[13px] font-semibold text-rrb-banner hover:underline">← Packages</Link>
        <h1 className="text-xl font-bold text-gray-900">{pkg.name}</h1>
      </div>
      <SaveForm action={savePackage} submitLabel="Save the package" className="mt-4 rounded border border-gray-300 bg-white p-5">
        <input type="hidden" name="slug" value={slug} />
        <PackageFields pkg={pkg} />
      </SaveForm>
      <RowForm action={deletePackage} className="mt-6">
        <input type="hidden" name="slug" value={slug} />
        <PendingButton pendingLabel="Deleting…" confirm={`Delete the package "${pkg.name}"?`} className="text-[12px] font-semibold text-red-700 hover:underline disabled:opacity-60">
          Delete this package
        </PendingButton>
      </RowForm>
    </>
  );
}
