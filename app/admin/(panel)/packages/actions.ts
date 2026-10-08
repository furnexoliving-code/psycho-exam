"use server";

import { revalidatePath } from "next/cache";
import { attempt, type SaveState } from "@/lib/admin-result";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/audit";
import { EXAMS, grantEnrollment, loadPackage, packagesChanged, revokeEnrollment, type PackageKind } from "@/lib/packages";

const BACK = "/admin/packages";
const KINDS: PackageKind[] = ["sectional", "full", "combo"];

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

/** The fields of the package form, checked. */
function fieldsOf(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("The name cannot be blank");
  const exam = String(formData.get("exam") ?? "alp");
  if (!EXAMS.some((e) => e.id === exam)) throw new Error("Unknown exam");
  const kind = String(formData.get("kind") ?? "") as PackageKind;
  if (!KINDS.includes(kind)) throw new Error("Choose what the package opens");
  const price = Number(formData.get("price_inr"));
  if (!Number.isInteger(price) || price < 0) throw new Error("The price must be a whole number of rupees (0 or more)");
  const mrpRaw = String(formData.get("mrp_inr") ?? "").trim();
  const mrp = mrpRaw === "" ? null : Number(mrpRaw);
  if (mrp !== null && (!Number.isInteger(mrp) || mrp < 0)) throw new Error("The MRP must be a whole number of rupees, or blank");
  const daysRaw = String(formData.get("validity_days") ?? "").trim();
  const days = daysRaw === "" ? null : Number(daysRaw);
  if (days !== null && (!Number.isInteger(days) || days < 1)) throw new Error("Validity must be a number of days, or blank for no expiry");
  return {
    name,
    name_hi: String(formData.get("name_hi") ?? "").trim(),
    exam,
    kind,
    price_inr: price,
    mrp_inr: mrp,
    validity_days: days,
    description: String(formData.get("description") ?? "").trim(),
    is_published: formData.get("is_published") === "on",
    sort_order: Number(formData.get("sort_order") ?? 0) || 0,
  };
}

export async function createPackage(_prev: SaveState | null, formData: FormData): Promise<SaveState> {
  return attempt("Package", async () => {
    await requireAdmin();
    const fields = fieldsOf(formData);
    const slug = slugify(String(formData.get("slug") ?? "") || `${fields.exam}-${fields.name}`) || `package-${Date.now()}`;
    const { error } = await createAdminClient().from("packages").insert({ slug, ...fields });
    if (error) throw new Error(/duplicate/i.test(error.message) ? `A package with the address "${slug}" already exists` : error.message);
    packagesChanged();
    revalidatePath(BACK);
    revalidatePath("/packages");
    revalidatePath("/");
    await logAction("Package created", `${fields.name} (${slug}) ₹${fields.price_inr}`);
    return `${fields.name} created`;
  });
}

export async function savePackage(_prev: SaveState | null, formData: FormData): Promise<SaveState> {
  return attempt("Package", async () => {
    await requireAdmin();
    const slug = String(formData.get("slug") ?? "");
    const fields = fieldsOf(formData);
    const { data, error } = await createAdminClient()
      .from("packages")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("slug", slug)
      .select("id");
    if (error) throw new Error(error.message);
    if (!data?.length) throw new Error("That package no longer exists");
    packagesChanged();
    revalidatePath(BACK);
    revalidatePath(`${BACK}/${slug}`);
    revalidatePath("/packages");
    revalidatePath("/");
    await logAction("Package saved", `${fields.name} (${slug}) ₹${fields.price_inr}${fields.is_published ? "" : " · unpublished"}`);
    return fields.is_published ? "saved and on sale" : "saved (not on sale)";
  });
}

export async function deletePackage(_prev: SaveState | null, formData: FormData): Promise<SaveState> {
  return attempt("Package", async () => {
    await requireAdmin();
    const slug = String(formData.get("slug") ?? "");
    const supabase = createAdminClient();
    const pkg = await loadPackage(slug);
    if (!pkg) throw new Error("That package no longer exists");
    const { count } = await supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("package_id", pkg.id);
    if (count) throw new Error(`${count} student${count === 1 ? " holds" : "s hold"} this package. Unpublish it instead of deleting it.`);
    const { error } = await supabase.from("packages").delete().eq("id", pkg.id);
    if (error) throw new Error(error.message);
    packagesChanged();
    revalidatePath(BACK);
    revalidatePath("/packages");
    await logAction("Package deleted", `${pkg.name} (${slug})`);
    return "deleted";
  });
}

/** Gives a student a package, from the institute. */
export async function enrollStudent(_prev: SaveState | null, formData: FormData): Promise<SaveState> {
  return attempt("Package", async () => {
    await requireAdmin();
    const userId = String(formData.get("user_id") ?? "");
    const slug = String(formData.get("package") ?? "");
    const pkg = await loadPackage(slug);
    if (!pkg) throw new Error("Choose a package");
    const until = String(formData.get("expires_on") ?? "").trim();
    let expiresAt: string | null = null;
    if (until) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(until)) throw new Error("The end date must be a date");
      expiresAt = new Date(`${until}T23:59:59+05:30`).toISOString();
    }
    await grantEnrollment(userId, pkg, { source: "institute", expiresAt, note: String(formData.get("note") ?? "").trim() || "Added by the institute" });
    revalidatePath(`/admin/students/${userId}`);
    await logAction("Package given", `${pkg.name} to ${userId}${until ? ` till ${until}` : ""}`);
    return `${pkg.name} added${until ? ` till ${until}` : ""}`;
  });
}

export async function unenrollStudent(_prev: SaveState | null, formData: FormData): Promise<SaveState> {
  return attempt("Package", async () => {
    await requireAdmin();
    const id = String(formData.get("enrollment_id") ?? "");
    const userId = String(formData.get("user_id") ?? "");
    await revokeEnrollment(id);
    revalidatePath(`/admin/students/${userId}`);
    await logAction("Package removed", `enrollment ${id} from ${userId}`);
    return "removed";
  });
}
