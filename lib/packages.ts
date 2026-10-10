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

/** The exams the portal knows, for the admin's selects: kept with the exams themselves. */
export { EXAMS } from "./exams";

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

/**
 * What one student holds, newest first, expired ones included (marked by
 * the date). Null when the packages SQL has not been run on this database
 * yet: the portal then works as before packages existed, everything open.
 */
export async function enrollmentsOf(userId: string): Promise<Enrollment[] | null> {
  try {
    const { data, error } = await createAdminClient()
      .from("enrollments")
      .select(`id, user_id, source, starts_at, expires_at, note, package:packages(${COLUMNS})`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      if (/enrollments|packages|schema cache|does not exist/i.test(error.message)) {
        console.error(`packages not set up yet (${error.message}); everything stays open`);
        return null;
      }
      return [];
    }
    if (!data) return [];
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
  const held = role === "admin" ? [] : await enrollmentsOf(userId);
  // No packages table yet: nothing is locked, as before packages existed.
  const enrollments = held ?? [];
  const access: Access = { sectional: new Set(), full: new Set(), enrollments, all: role === "admin" || held === null };
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

/** What a new institute student starts with: the published Sectional + Full Mock package of the exam, else its first published package. */
export async function defaultPackage(exam = "alp"): Promise<Package | null> {
  const all = await listPackages(exam);
  return all.find((p) => p.kind === "combo") ?? all[0] ?? null;
}

/** The value of the package field that gives a new student nothing. */
export const NO_PACKAGE = "none";

/**
 * Gives a new institute student their starting package: the one named by
 * slug, the default when the slug is blank, nothing for NO_PACKAGE. The
 * package runs till the account's validity date when it has one, else
 * without expiry: the institute decides, not the package's own days. A
 * database without the packages tables is left alone.
 */
export async function enrollNewStudent(userId: string, slug: string, validUntil: string | null): Promise<Package | null> {
  if (slug === NO_PACKAGE) return null;
  try {
    const pkg = slug ? await loadPackage(slug) : await defaultPackage();
    if (!pkg) return null;
    const expiresAt = validUntil ? new Date(`${validUntil}T23:59:59+05:30`).toISOString() : null;
    await grantEnrollment(userId, pkg, { source: "institute", expiresAt, note: "Given with the account" });
    return pkg;
  } catch {
    return null;
  }
}

/** Every switched-on student with no package at all, oldest first; empty when the tables are missing. */
export async function studentsWithoutPackage(): Promise<{ id: string; fullName: string; validUntil: string | null }[]> {
  try {
    const supabase = createAdminClient();
    // Page by page: the database hands back at most a thousand rows per
    // call, and both lists have grown past that. A list cut short would
    // count enrolled students as having none.
    const enrolled: { user_id: string }[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from("enrollments").select("user_id").order("id").range(from, from + 999);
      if (error) return [];
      enrolled.push(...((data ?? []) as { user_id: string }[]));
      if ((data ?? []).length < 1000) break;
    }
    const has = new Set(enrolled.map((e) => e.user_id));
    const students: Record<string, unknown>[] = [];
    for (let from = 0; ; from += 1000) {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, valid_until")
        .eq("role", "student")
        .eq("is_active", true)
        .order("created_at")
        .order("id")
        .range(from, from + 999);
      students.push(...((data ?? []) as Record<string, unknown>[]));
      if ((data ?? []).length < 1000) break;
    }
    return students
      .filter((s) => !has.has(s.id as string))
      .map((s) => ({ id: s.id as string, fullName: (s.full_name as string) || "Unnamed", validUntil: (s.valid_until as string | null) ?? null }));
  } catch {
    return [];
  }
}

/**
 * Gives one package to many students at once, in a few inserts rather
 * than one round trip per student: hundreds of accounts in seconds, well
 * inside the time a server action is allowed. Each runs till the
 * account's validity date, or without expiry. A student who already
 * holds the package is left as they are and not counted.
 */
export async function grantToMany(students: { id: string; validUntil: string | null }[], pkg: Package, note: string): Promise<number> {
  const supabase = createAdminClient();
  let given = 0;
  for (let i = 0; i < students.length; i += 200) {
    const rows = students.slice(i, i + 200).map((s) => ({
      user_id: s.id,
      package_id: pkg.id,
      source: "institute",
      expires_at: s.validUntil ? new Date(`${s.validUntil}T23:59:59+05:30`).toISOString() : null,
      order_id: null,
      note,
    }));
    // A student who already holds the package is skipped, not an error:
    // one such row must not stop the whole batch.
    const { data, error } = await supabase
      .from("enrollments")
      .upsert(rows, { onConflict: "user_id,package_id", ignoreDuplicates: true })
      .select("id");
    if (error) throw new Error(error.message);
    given += data?.length ?? 0;
  }
  return given;
}
