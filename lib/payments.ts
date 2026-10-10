import { revalidateTag, unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { PANEL_ROLES, type Role } from "@/lib/auth";
import { razorpayConfigured, razorpayKeyId } from "@/lib/razorpay";

/**
 * Whether online payment is open, and to whom. The gateway's keys sit in
 * the environment; this switch decides who may use them:
 *
 *   off   nobody, however the keys are set: the packages page says to
 *         pay the team;
 *   team  only panel accounts see Buy and can run a payment, so the team
 *         can try the whole flow with Razorpay's test keys, or a rupee on
 *         the live ones, while every student still sees "off";
 *   on    everyone.
 *
 * A student is never offered a checkout on test keys, whatever the
 * switch says: a test card would "buy" the package for nothing.
 */
export type PaymentsMode = "off" | "team" | "on";

export const PAYMENTS_MODES: readonly PaymentsMode[] = ["off", "team", "on"];

const TAG = "portal-settings";
const KEY = "payments";
const SITE_URL = "https://kautilyaonline.com";

/** Where Razorpay must send its webhooks, to paste into its dashboard. */
export const WEBHOOK_URL = `${SITE_URL}/api/razorpay/webhook`;

export function isPaymentsMode(value: unknown): value is PaymentsMode {
  return typeof value === "string" && (PAYMENTS_MODES as readonly string[]).includes(value);
}

export async function paymentsMode(): Promise<PaymentsMode> {
  return unstable_cache(
    async () => {
      let supabase: ReturnType<typeof createAdminClient>;
      try {
        supabase = createAdminClient();
      } catch {
        return "off" as PaymentsMode;
      }
      const { data, error } = await supabase.from("portal_settings").select("value").eq("key", KEY).maybeSingle();
      if (error || !data) return "off" as PaymentsMode;
      const mode = (data.value as { mode?: unknown } | null)?.mode;
      return isPaymentsMode(mode) ? mode : "off";
    },
    ["payments-mode"],
    { tags: [TAG], revalidate: 300 },
  )();
}

export async function savePaymentsMode(mode: PaymentsMode): Promise<void> {
  const { error } = await createAdminClient()
    .from("portal_settings")
    .upsert({ key: KEY, value: { mode }, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  revalidateTag(TAG);
}

/** "test" on Razorpay's test keys, "live" on the real ones, null without a key. */
export function razorpayKeyKind(): "test" | "live" | null {
  const id = razorpayKeyId();
  if (!id) return null;
  return id.startsWith("rzp_test_") ? "test" : "live";
}

export interface KeyStatus {
  /** The key id, which the browser sees anyway, shortened. */
  keyId: string | null;
  kind: "test" | "live" | null;
  secretSet: boolean;
  webhookSecretSet: boolean;
}

export function razorpayKeyStatus(): KeyStatus {
  const id = razorpayKeyId();
  return {
    keyId: id ? `${id.slice(0, 9)}…${id.slice(-4)}` : null,
    kind: razorpayKeyKind(),
    secretSet: Boolean(process.env.RAZORPAY_KEY_SECRET?.trim()),
    webhookSecretSet: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET?.trim()),
  };
}

/** Whether this visitor is offered the online checkout. Null is a visitor who is not signed in. */
export async function onlineBuyingFor(role: Role | null): Promise<boolean> {
  if (!razorpayConfigured()) return false;
  const mode = await paymentsMode();
  if (mode === "off") return false;
  const team = role !== null && PANEL_ROLES.includes(role);
  if (team) return true;
  return mode === "on" && razorpayKeyKind() === "live";
}

/** One line on where payment stands, for the panel. */
export async function paymentsSummary(): Promise<{ text: string; tone: "ok" | "warn" | "off" }> {
  const status = razorpayKeyStatus();
  const mode = await paymentsMode();
  if (!status.keyId || !status.secretSet) return { text: "Online payment is off: the Razorpay keys are not in Vercel yet. Packages are added by the team from the student's page.", tone: "off" };
  if (mode === "off") return { text: `Razorpay ${status.kind} keys are set, but online payment is switched off for everyone. Switch it on under Settings & team.`, tone: "off" };
  if (mode === "team") return { text: `Razorpay ${status.kind} keys are set; online payment is open to the team only, for testing. Students still pay the team.`, tone: "warn" };
  if (status.kind !== "live") return { text: "Online payment is set to everyone, but the keys are test keys, so students are not offered it. Put the live keys in Vercel.", tone: "warn" };
  return { text: "Online payment is on (Razorpay live). Paid packages are added to the student's account automatically.", tone: "ok" };
}
