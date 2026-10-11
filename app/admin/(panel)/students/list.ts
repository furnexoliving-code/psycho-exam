import { createAdminClient } from "@/lib/supabase/admin";
import { normalisePhone } from "@/lib/phone";
import { fetchAll } from "@/lib/wt/cohort";
import type { PackageKind } from "@/lib/packages";

/**
 * The Students list, searched, filtered and paged. Name, number, quiet
 * days and sign-up source are filtered in the database. A package filter
 * is not: an enrollment is a row in another table, so the list is read
 * whole and sorted here, which thousands of accounts allow.
 */
export interface StudentRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  is_active: boolean;
  last_seen_at: string | null;
  signup_source: string | null;
  valid_until: string | null;
}

export interface Held {
  slug: string;
  name: string;
  kind: PackageKind;
  expiresAt: string | null;
}

export interface ListFilter {
  q: string;
  quietDays: 0 | 7 | 30;
  /** "" all · "none" no package · "self" made their own account · a package slug. */
  pkg: string;
}

const COLUMNS = "id, full_name, phone, created_at, is_active, last_seen_at, signup_source, valid_until";

/** The filters the database applies, on any query over profiles. */
// A select builder's exact type depends on its column string; the filters
// below are the same on all of them, so the builder is taken as it comes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProfilesQuery = any;
function applyDb(request: ProfilesQuery, filter: ListFilter): ProfilesQuery {
  let q = request.eq("role", "student");
  if (filter.quietDays) {
    const cutoff = new Date(Date.now() - filter.quietDays * 86400000).toISOString();
    q = q.eq("is_active", true).or(`last_seen_at.is.null,last_seen_at.lt.${cutoff}`);
  }
  if (filter.pkg === "self") q = q.eq("signup_source", "self");
  const query = filter.q.trim();
  if (query) {
    const digits = normalisePhone(query);
    q = /^\d{4,}$/.test(digits) ? q.like("phone", `%${digits}%`) : q.ilike("full_name", `%${query.replace(/[%_]/g, "")}%`);
  }
  return q;
}

/** Every running enrollment, by student. One paged read of the table. */
export async function heldByStudent(): Promise<Map<string, Held[]>> {
  const supabase = createAdminClient();
  const rows = await fetchAll<{ user_id: string; expires_at: string | null; package: { slug: string; name: string; kind: PackageKind } | null }>(
    (from, to) => supabase.from("enrollments").select("user_id, expires_at, package:packages(slug, name, kind)").order("id").range(from, to) as never,
  ).catch(() => []);
  return groupHeld(rows);
}

/** The running enrollments of these students only. */
export async function heldByThese(ids: string[]): Promise<Map<string, Held[]>> {
  if (ids.length === 0) return new Map();
  const { data } = await createAdminClient().from("enrollments").select("user_id, expires_at, package:packages(slug, name, kind)").in("user_id", ids);
  return groupHeld((data ?? []) as never);
}

function groupHeld(rows: { user_id: string; expires_at: string | null; package: { slug: string; name: string; kind: PackageKind } | null }[]): Map<string, Held[]> {
  const now = Date.now();
  const out = new Map<string, Held[]>();
  for (const r of rows) {
    if (!r.package) continue;
    if (r.expires_at && new Date(r.expires_at).getTime() <= now) continue;
    const list = out.get(r.user_id) ?? [];
    list.push({ slug: r.package.slug, name: r.package.name, kind: r.package.kind, expiresAt: r.expires_at });
    out.set(r.user_id, list);
  }
  return out;
}

function wantsPackage(filter: ListFilter, held: Map<string, Held[]>): ((id: string) => boolean) | null {
  if (filter.pkg === "none") return (id) => !held.has(id);
  if (filter.pkg && filter.pkg !== "self") return (id) => (held.get(id) ?? []).some((h) => h.slug === filter.pkg);
  return null;
}

/** One page of the list and the total, with what each student on the page holds. */
export async function loadStudents(filter: ListFilter, page: number, pageSize: number): Promise<{ rows: StudentRow[]; total: number; held: Map<string, Held[]> }> {
  const supabase = createAdminClient();
  const from = (page - 1) * pageSize;
  const byPackage = filter.pkg && filter.pkg !== "self";
  if (!byPackage) {
    const { data, count } = await applyDb(supabase.from("profiles").select(COLUMNS, { count: "exact" }), filter)
      .order("created_at", { ascending: false })
      .order("id")
      .range(from, from + pageSize - 1);
    const rows = (data ?? []) as StudentRow[];
    return { rows, total: count ?? 0, held: await heldByThese(rows.map((r) => r.id)) };
  }
  const held = await heldByStudent();
  const keep = wantsPackage(filter, held)!;
  const all = await fetchAll<StudentRow>((a, b) => applyDb(supabase.from("profiles").select(COLUMNS), filter).order("created_at", { ascending: false }).order("id").range(a, b));
  const matching = all.filter((r) => keep(r.id));
  return { rows: matching.slice(from, from + pageSize), total: matching.length, held };
}

/** Every student the filter matches, for a package given to all of them. */
export async function studentsMatching(filter: ListFilter): Promise<{ id: string; validUntil: string | null }[]> {
  const supabase = createAdminClient();
  const all = await fetchAll<{ id: string; valid_until: string | null }>((a, b) => applyDb(supabase.from("profiles").select("id, valid_until"), filter).order("created_at").order("id").range(a, b));
  const keep = wantsPackage(filter, filter.pkg && filter.pkg !== "self" ? await heldByStudent() : new Map());
  return all.filter((r) => !keep || keep(r.id)).map((r) => ({ id: r.id, validUntil: r.valid_until }));
}

/** The filter off the page's query string. */
export function filterOf(params: { q?: string; quiet?: string; pkg?: string }): ListFilter {
  return { q: (params.q ?? "").trim(), quietDays: params.quiet === "7" ? 7 : params.quiet === "30" ? 30 : 0, pkg: (params.pkg ?? "").trim() };
}

/** The query string for a filter, with the page. */
export function listHref(filter: ListFilter, page = 1): string {
  const p = new URLSearchParams();
  if (filter.q) p.set("q", filter.q);
  if (filter.quietDays) p.set("quiet", String(filter.quietDays));
  if (filter.pkg) p.set("pkg", filter.pkg);
  if (page > 1) p.set("page", String(page));
  const qs = p.toString();
  return `/admin/students${qs ? `?${qs}` : ""}#list`;
}
