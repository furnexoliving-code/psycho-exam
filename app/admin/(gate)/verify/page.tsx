import { redirect } from "next/navigation";
import { TotpVerify } from "@/components/admin/TotpVerify";
import { requireStaffRole, secondFactor } from "@/lib/auth";

/**
 * Only a path inside the panel is honoured as the place to return to — and
 * never one of the two gate pages themselves, which would loop.
 */
function safeNext(next: string | undefined, fallback: string): string {
  if (!next || !next.startsWith("/")) return fallback;
  try {
    const url = new URL(next, "http://x");
    if (url.origin !== "http://x") return fallback;
    if (!/^\/(admin|staff)(\/|$)/.test(url.pathname)) return fallback;
    if (/^\/admin\/(verify|setup-2fa)(\/|$)/.test(url.pathname)) return fallback;
    return url.pathname + url.search;
  } catch {
    return fallback;
  }
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  // The role check belongs here as well as in the layout. Staff return to
  // their own page, an admin to the panel.
  const profile = await requireStaffRole("/admin");
  const target = safeNext(next, profile.role === "staff" ? "/staff" : "/admin");

  const { enrolled, passed } = await secondFactor();
  if (!enrolled) redirect(`/admin/setup-2fa?next=${encodeURIComponent(target)}`);
  if (passed) redirect(target);

  return (
    <>
      <h1 className="text-center text-2xl font-bold text-gray-900">Admin verification</h1>
      <p className="mt-1 text-center text-[13px] text-gray-600">
        Open your authenticator app and enter the six-digit code it shows for this
        portal.
      </p>
      <div className="mt-6 rounded border border-gray-300 bg-white p-5">
        <TotpVerify next={target} />
      </div>
    </>
  );
}
