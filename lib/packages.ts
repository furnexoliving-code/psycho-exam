import { revalidateTag, unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Packages: what a student buys, or is given by the institute, and what it
 * opens. A sectional package opens the practice papers of one exam's
 * series, a full package its Full Mocks, a combo both. A mock marked free
 * is open to every signed-in student, package or not.
 */
export type PackageKind = "sectional" | "full" | "combo";

export interface Package {
  id: string;
  slug: string;
  exam: string;
  name: string;
  nameHi: string;
  kind: PackageKind;
  priceInr: number;
  mrpInr: number | null;
  validityDays: number | null;
  description: string;
  isPublished: boolean;
  sortOrder: number;
}

export interface Enrollment {
  id: string;
  userId: string;
  package: Package;
  source: "institute" | "purchase";
  startsAt: string;
  expiresAt: string | null;
  note: string;
}

/** The exams the portal knows, for the admin's selects. */
export const EXAMS = [
  { id: "alp", name: "RRB ALP" },
  { id: "asm", name: "RRB ASM / Station Master" },
  { id: "train-operator", name: "Train Operator" },
] as const;

export const KIND_LABEL: Record<PackageKind, string> = {
  sectional: "Sectional tests",
  full: "Full Mock Tests",
  combo: "Sectional + Full Mock",
};

const TAG = "packages";

export function packagesChanged(): void {
  revalidateTag(TAG);
}

interface PackageRow {
  id: string;
  slug: string;
  exam: string;
  name: string;
  name_hi: string | null;
  kind: PackageKind;
  price_inr: number;
  mrp_inr: number | null;
  validity_days: number | null;
  description: string | null;
  is_published: boolean;
  sort_order: number;
}

const COLUMNS = "id, slug, exam, name, name_hi, kind, price_inr, mrp_inr, validity_days, description, is_published, sort_order";

function toPackage(r: PackageRow): Package {
  return {
    id: r.id,
    slug: r.slug,
    exam: r.exam ?? "alp",
    name: r.name,
    nameHi: r.name_hi ?? "",
    kind: r.kind,
    priceInr: Number(r.price_inr ?? 0),
    mrpInr: r.mrp_inr === null ? null : Number(r.mrp_inr),
    validityDays: r.validity_days ?? null,
    description: r.description ?? "",
    isPublished: r.is_published,
    sortOrder: Number(r.sort_order ?? 0),
  };
}

/** The packages on sale, from the shared cache; an empty list before the SQL has run. */
export async function listPackages(exam?: string): Promise<Package[]> {
  return unstable_cache(
    async () => {
      try {
        const { data, error } = await createAdminClient().from("packages").select(COLUMNS).eq("is_published", true).order("sort_order").order("created_at");
        if (error) return [];
        return (data as PackageRow[]).map(toPackage);
      } catch {
        return [];
      }
    },
    ["published-packages"],
    { tags: [TAG], revalidate: 300 },
  )().then((list) => (exam ? list.filter((p) => p.exam === exam) : list));
}

/** Every package, for the admin. */
export async function listAllPackages(): Promise<Package[]> {
  const { data, error } = await createAdminClient().from("packages").select(COLUMNS).order("exam").order("sort_order").order("created_at");
  if (error) return [];
  return (data as PackageRow[]).map(toPackage);
}

export async function loadPackage(slug: string): Promise<Package | null> {
  const { data, error } = await createAdminClient().from("packages").select(COLUMNS).eq("slug", slug).maybeSingle();
  if (error || !data) return null;
  return toPackage(data as PackageRow);
}

/** What one student holds, newest first, expired ones included (marked by the date). */
export async function enrollmentsOf(userId: string): Promise<Enrollment[]> {
  try {
    const { data, error } = await createAdminClient()
      .from("enrollments")
      .select(`id, user_id, source, starts_at, expires_at, note, package:packages(${COLUMNS})`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return (data as unknown as { id: string; user_id: string; source: "institute" | "purchase"; starts_at: string; expires_at: string | null; note: string; package: PackageRow | null }[])
      .filter((r) => r.package)
      .map((r) => ({ id: r.id, userId: r.user_id, package: toPackage(r.package as PackageRow), source: r.source, startsAt: r.starts_at, expiresAt: r.expires_at, note: r.note ?? "" }));
  } catch {
    return [];
  }
}

export function enrollmentActive(e: Enrollment, now = Date.now()): boolean {
  return e.expiresAt === null || new Date(e.expiresAt).getTime() > now;
}

/** What a student may open right now. */
export interface Access {
  /** Exams whose practice papers are open. */
  sectional: Set<string>;
  /** Exams whose Full Mocks are open. */
  full: Set<string>;
  enrollments: Enrollment[];
  /** True for the admin: everything is open. */
  all: boolean;
}

export async function accessFor(userId: string, role: string): Promise<Access> {
  const enrollments = role === "admin" ? [] : await enrollmentsOf(userId);
  const access: Access = { sectional: new Set(), full: new Set(), enrollments, all: role === "admin" };
  for (const e of enrollments) {
    if (!enrollmentActive(e)) continue;
    if (e.package.kind === "sectional" || e.package.kind === "combo") access.sectional.add(e.package.exam);
    if (e.package.kind === "full" || e.package.kind === "combo") access.full.add(e.package.exam);
  }
  return access;
}

export function canPractice(access: Access, exam: string): boolean {
  return access.all || access.sectional.has(exam);
}

export function canSitMock(access: Access, mock: { exam: string; isFree: boolean }): boolean {
  return access.all || mock.isFree || access.full.has(mock.exam);
}

/**
 * Gives a student a package. An enrollment they already hold is extended or
 * refreshed rather than duplicated: the end date moves to the later of the
 * two, and a package with no end stays endless.
 */
export async function grantEnrollment(
  userId: string,
  pkg: Package,
  opts: { source: "institute" | "purchase"; validityDays?: number | null; expiresAt?: string | null; orderId?: string | null; note?: string },
): Promise<void> {
  const supabase = createAdminClient();
  const days = opts.validityDays === undefined ? pkg.validityDays : opts.validityDays;
  const fresh = opts.expiresAt !== undefined ? opts.expiresAt : days ? new Date(Date.now() + days * 86400000).toISOString() : null;
  const { data: existing } = await supabase.from("enrollments").select("id, expires_at").eq("user_id", userId).eq("package_id", pkg.id).maybeSingle();
  if (existing) {
    const current = existing.expires_at as string | null;
    // Still running: add the new validity on top; lapsed or endless: as computed.
    let expiresAt = fresh;
    if (fresh && current && new Date(current).getTime() > Date.now() && days) {
      expiresAt = new Date(new Date(current).getTime() + days * 86400000).toISOString();
    }
    if (current === null) expiresAt = null;
    const { error } = await supabase
      .from("enrollments")
      .update({ expires_at: expiresAt, source: opts.source, order_id: opts.orderId ?? null, note: opts.note ?? "" })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await supabase.from("enrollments").insert({
    user_id: userId,
    package_id: pkg.id,
    source: opts.source,
    expires_at: fresh,
    order_id: opts.orderId ?? null,
    note: opts.note ?? "",
  });
  if (error) throw new Error(error.message);
}

export async function revokeEnrollment(enrollmentId: string): Promise<void> {
  const { error } = await createAdminClient().from("enrollments").delete().eq("id", enrollmentId);
  if (error) throw new Error(error.message);
}

export function rupees(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}
