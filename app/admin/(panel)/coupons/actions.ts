"use server";

import { revalidatePath } from "next/cache";
import { attempt, type SaveState } from "@/lib/admin-result";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/audit";
import { normaliseCode } from "@/lib/coupons";

const BACK = "/admin/coupons";

export async function createCoupon(_prev: SaveState | null, formData: FormData): Promise<SaveState> {
  return attempt("Coupon", async () => {
    await requireAdmin();
    const code = normaliseCode(String(formData.get("code") ?? ""));
    if (!/^[A-Z0-9-]{3,32}$/.test(code)) throw new Error("The code must be 3 to 32 letters, digits or dashes");
    const kind = String(formData.get("kind") ?? "percent");
    if (kind !== "percent" && kind !== "amount") throw new Error("Choose percent or amount");
    const value = Number(formData.get("value"));
    if (!Number.isInteger(value) || value <= 0 || (kind === "percent" && value > 100)) throw new Error(kind === "percent" ? "Percent must be 1 to 100" : "Amount must be a whole number of rupees");
    const packageSlug = String(formData.get("package_slug") ?? "").trim() || null;
    const maxRaw = String(formData.get("max_uses") ?? "").trim();
    const maxUses = maxRaw === "" ? null : Number(maxRaw);
    if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) throw new Error("Max uses must be a number, or blank");
    const until = String(formData.get("expires_on") ?? "").trim();
    if (until && !/^\d{4}-\d{2}-\d{2}$/.test(until)) throw new Error("The expiry must be a date");
    const expiresAt = until ? new Date(`${until}T23:59:59+05:30`).toISOString() : null;
    const { error } = await createAdminClient().from("coupons").insert({
      code,
      kind,
      value,
      package_slug: packageSlug,
      max_uses: maxUses,
      expires_at: expiresAt,
      note: String(formData.get("note") ?? "").trim(),
    });
    if (error) throw new Error(/duplicate/i.test(error.message) ? `The code ${code} already exists` : /coupons/i.test(error.message) ? "Run supabase/coupons.sql first" : error.message);
    revalidatePath(BACK);
    await logAction("Coupon created", `${code}: ${kind === "percent" ? `${value}% off` : `₹${value} off`}${packageSlug ? ` on ${packageSlug}` : ""}`);
    return `${code} created`;
  });
}

export async function setCouponActive(_prev: SaveState | null, formData: FormData): Promise<SaveState> {
  return attempt("Coupon", async () => {
    await requireAdmin();
    const id = String(formData.get("id") ?? "");
    const active = formData.get("active") === "true";
    const { error } = await createAdminClient().from("coupons").update({ is_active: active }).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath(BACK);
    await logAction(active ? "Coupon switched on" : "Coupon switched off", id);
    return active ? "on" : "off";
  });
}
