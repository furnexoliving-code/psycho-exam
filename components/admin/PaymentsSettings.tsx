import Link from "next/link";
import { SaveForm } from "@/components/admin/SaveForm";
import { updatePaymentsMode } from "@/app/admin/(panel)/team/actions";
import type { KeyStatus, PaymentsMode } from "@/lib/payments";

const MODES: { value: PaymentsMode; label: string; note: string }[] = [
  { value: "off", label: "Off", note: "Nobody pays online. The packages page tells students to pay the team." },
  { value: "team", label: "Team only (testing)", note: "Only panel accounts see Buy. Try the whole flow yourself; students still see it as off." },
  { value: "on", label: "On for everyone", note: "Students buy on the packages page and the package is added the moment the payment goes through." },
];

/**
 * The Razorpay switch and what it needs: which keys Vercel holds, the
 * webhook address to paste into Razorpay, and who may pay online right
 * now. The keys themselves never appear here; only whether they are set.
 */
export function PaymentsSettings({ status, mode, webhookUrl, paidOrders }: { status: KeyStatus; mode: PaymentsMode; webhookUrl: string; paidOrders: number }) {
  const keysReady = Boolean(status.keyId && status.secretSet);
  const Row = ({ label, ok, value }: { label: string; ok: boolean; value: string }) => (
    <div className="flex items-center justify-between gap-3 border-t border-gray-200 py-1.5 text-[12.5px] first:border-t-0">
      <span className="text-gray-700">{label}</span>
      <span className={`font-semibold ${ok ? "text-green-700" : "text-gray-500"}`}>{value}</span>
    </div>
  );

  return (
    <section id="payments" className="mt-4 rounded border border-gray-300 bg-white p-5">
      <h2 className="text-[15px] font-bold text-gray-900">Online payment (Razorpay)</h2>
      <p className="mt-1 text-[12px] text-gray-600">
        The checkout is built in. The keys live in Vercel, never here; this switch decides who may use them.
        Test it with the team-only setting first, then open it to everyone on the live keys.
      </p>

      <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded border border-gray-200 bg-gray-50 p-3">
          <h3 className="text-[12px] font-bold uppercase tracking-wide text-gray-500">Keys in Vercel</h3>
          <div className="mt-1">
            <Row label="RAZORPAY_KEY_ID" ok={Boolean(status.keyId)} value={status.keyId ? `${status.keyId} · ${status.kind === "live" ? "LIVE" : "TEST"}` : "not set"} />
            <Row label="RAZORPAY_KEY_SECRET" ok={status.secretSet} value={status.secretSet ? "set" : "not set"} />
            <Row label="RAZORPAY_WEBHOOK_SECRET" ok={status.webhookSecretSet} value={status.webhookSecretSet ? "set" : "not set"} />
            <Row label="Paid online so far" ok={paidOrders > 0} value={String(paidOrders)} />
          </div>
          <p className="mt-2 text-[11.5px] text-gray-600">
            Webhook address for Razorpay (Settings → Webhooks, events <i>payment.captured</i> and <i>order.paid</i>):
          </p>
          <code className="mt-1 block select-all break-all rounded border border-gray-300 bg-white px-2 py-1 text-[11.5px] text-gray-900">{webhookUrl}</code>
          {status.kind === "test" && (
            <p className="mt-2 text-[11.5px] text-amber-800">Test keys: no real money moves. Students are never offered a checkout on test keys, whatever the switch says.</p>
          )}
          {!status.webhookSecretSet && keysReady && (
            <p className="mt-2 text-[11.5px] text-amber-800">Without the webhook secret a payment still goes through, but a student whose browser closes mid-payment waits for the team to add the package.</p>
          )}
        </div>

        <SaveForm action={updatePaymentsMode} submitLabel="Save payment setting" className="min-w-0">
          <h3 className="text-[12px] font-bold uppercase tracking-wide text-gray-500">Who may pay online</h3>
          <div className="mt-1 space-y-2">
            {MODES.map((m) => {
              const blocked = (m.value !== "off" && !keysReady) || (m.value === "on" && status.kind !== "live");
              return (
                <label key={m.value} className={`flex cursor-pointer items-start gap-2 rounded border px-3 py-2 ${mode === m.value ? "border-[#0d2a6b] bg-[#eef2fb]" : "border-gray-200"} ${blocked ? "opacity-60" : ""}`}>
                  <input type="radio" name="mode" value={m.value} defaultChecked={mode === m.value} className="mt-0.5" />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-gray-900">{m.label}</span>
                    <span className="block text-[11.5px] text-gray-600">{m.note}</span>
                    {blocked && m.value === "on" && keysReady && <span className="block text-[11.5px] text-amber-800">Needs the live keys in Vercel.</span>}
                    {blocked && !keysReady && <span className="block text-[11.5px] text-amber-800">Needs the keys in Vercel first.</span>}
                  </span>
                </label>
              );
            })}
          </div>
          <p className="mt-2 text-[11.5px] text-gray-500">
            In team-only mode: open <Link href="/packages" className="font-semibold text-rrb-banner hover:underline">the packages page</Link> yourself, press Buy, and pay with Razorpay&apos;s test UPI id <code className="rounded bg-gray-100 px-1">success@razorpay</code>. The order shows under <Link href="/admin/orders" className="font-semibold text-rrb-banner hover:underline">Orders &amp; payments</Link>.
          </p>
        </SaveForm>
      </div>
    </section>
  );
}
