import { redirect } from "next/navigation";
import { TotpVerify } from "@/components/admin/TotpVerify";
import { secondFactor } from "@/lib/auth";

/** Only a path inside the panel is honoured as the place to return to. */
function safeNext(next: string | undefined): string {
  if (!next || !next.startsWith("/admin")) return "/admin";
  try {
    const url = new URL(next, "http://x");
    if (url.origin !== "http://x" || !url.pathname.startsWith("/admin")) return "/admin";
    return url.pathname + url.search;
  } catch {
    return "/admin";
  }
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = safeNext(next);

  const { enrolled, passed } = await secondFactor();
  if (!enrolled) redirect("/admin/setup-2fa");
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
