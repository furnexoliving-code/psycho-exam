import { createAdminClient } from "@/lib/supabase/admin";
import type { Package } from "@/lib/packages";

/** A discount code: a percentage or an amount off, maybe limited. */
export interface Coupon {
  id: string;
  code: string;
  kind: "percent" | "amount";
  value: number;
  packageSlug: string | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  note: string;
  createdAt: string;
}

interface CouponRow {
  id: string;
  code: string;
  kind: "percent" | "amount";
  value: number;
  package_slug: string | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  note: string | null;
  created_at: string;
}

const COLUMNS = "id, code, kind, value, package_slug, max_uses, used_count, expires_at, is_active, note, created_at";

function toCoupon(r: CouponRow): Coupon {
  return {
    id: r.id,
    code: r.code,
    kind: r.kind,
    value: Number(r.value),
    packageSlug: r.package_slug,
    maxUses: r.max_uses,
    usedCount: Number(r.used_count ?? 0),
    expiresAt: r.expires_at,
    isActive: r.is_active,
    note: r.note ?? "",
    createdAt: r.created_at,
  };
}

/** Codes are kept upper case without spaces; a student may type them any way. */
export function normaliseCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "").slice(0, 32);
}

export async function loadCoupon(rawCode: string): Promise<Coupon | null> {
  const code = normaliseCode(rawCode);
  if (!code) return null;
  try {
    const { data, error } = await createAdminClient().from("coupons").select(COLUMNS).eq("code", code).maybeSingle();
    if (error || !data) return null;
    return toCoupon(data as CouponRow);
  } catch {
    return null;
  }
}

export async function listCoupons(): Promise<Coupon[]> {
  const { data, error } = await createAdminClient().from("coupons").select(COLUMNS).order("created_at", { ascending: false });
  if (error) return [];
  return (data as CouponRow[]).map(toCoupon);
}

/** Why a code cannot be used, or null when it can. */
export function couponProblem(c: Coupon, pkg?: Package): string | null {
  if (!c.isActive) return "This code is no longer active.";
  if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) return "This code has expired.";
  if (c.maxUses !== null && c.usedCount >= c.maxUses) return "This code has been used up.";
  if (pkg && c.packageSlug && c.packageSlug !== pkg.slug) return `This code works only on ${c.packageSlug.replace(/-/g, " ")}.`;
  return null;
}

/** The price after the code, never below zero, whole rupees. */
export function discounted(c: Coupon, priceInr: number): { price: number; discount: number } {
  const off = c.kind === "percent" ? Math.round((priceInr * Math.min(100, c.value)) / 100) : Math.min(priceInr, c.value);
  return { price: Math.max(0, priceInr - off), discount: off };
}

/** A code checked against a package: the price it gives, or the reason it does not. */
export async function applyCoupon(rawCode: string, pkg: Package): Promise<{ ok: true; coupon: Coupon; price: number; discount: number } | { ok: false; error: string }> {
  const coupon = await loadCoupon(rawCode);
  if (!coupon) return { ok: false, error: "No such code." };
  const problem = couponProblem(coupon, pkg);
  if (problem) return { ok: false, error: problem };
  const { price, discount } = discounted(coupon, pkg.priceInr);
  return { ok: true, coupon, price, discount };
}

/** One more use of the code, when its order is paid. */
export async function countCouponUse(code: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("coupons").select("id, used_count").eq("code", normaliseCode(code)).maybeSingle();
    if (!data) return;
    await supabase.from("coupons").update({ used_count: Number(data.used_count ?? 0) + 1 }).eq("id", data.id);
  } catch {
    // The sale stands; the count is a courtesy.
  }
}
