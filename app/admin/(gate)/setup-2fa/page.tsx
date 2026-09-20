import { redirect } from "next/navigation";
import { TotpSetup } from "@/components/admin/TotpSetup";
import { panelHome, requirePanelRole, secondFactor } from "@/lib/auth";

export default async function SetupTwoFactorPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const profile = await requirePanelRole("/admin");
  const home = panelHome(profile.role);
  // Only a path inside the panel is honoured as the way back.
  const target = next && /^\/admin(\/|$)/.test(next) && !next.includes("\\") ? next : home;

  const { enrolled } = await secondFactor();
  // Already set up: the code page is the one to be on.
  if (enrolled) redirect(`/admin/verify?next=${encodeURIComponent(target)}`);

  return (
    <>
      <h1 className="text-center text-2xl font-bold text-gray-900">
        {profile.role === "admin" ? "Protect the admin panel" : "Protect your sign-in"}
      </h1>
      <p className="mt-1 text-center text-[13px] text-gray-600">
        From now on this opens with your password AND a code from your phone.
        A password alone — guessed, shared or stolen — is no longer enough.
      </p>
      <div className="mt-6 rounded border border-gray-300 bg-white p-5">
        <TotpSetup next={target} />
      </div>
      <p className="mt-4 text-[12px] text-gray-500">
        Lost the phone later? Whoever holds the Supabase dashboard login opens
        Authentication → Users, opens your account and chooses{" "}
        <strong>Remove MFA factors</strong>; the panel then asks you to set one up
        again.
      </p>
    </>
  );
}
