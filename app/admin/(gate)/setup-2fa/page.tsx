import { redirect } from "next/navigation";
import { TotpSetup } from "@/components/admin/TotpSetup";
import { secondFactor } from "@/lib/auth";

export default async function SetupTwoFactorPage() {
  const { enrolled } = await secondFactor();
  // Already set up: the code page is the one to be on.
  if (enrolled) redirect("/admin/verify");

  return (
    <>
      <h1 className="text-center text-2xl font-bold text-gray-900">Protect the admin panel</h1>
      <p className="mt-1 text-center text-[13px] text-gray-600">
        From now on the panel opens with your password AND a code from your phone.
        A password alone — guessed, shared or stolen — is no longer enough.
      </p>
      <div className="mt-6 rounded border border-gray-300 bg-white p-5">
        <TotpSetup />
      </div>
      <p className="mt-4 text-[12px] text-gray-500">
        Lost the phone later? An admin with access to the Supabase dashboard can
        remove the authenticator under Authentication → Users → your account →
        Factors, and the panel will ask you to set one up again.
      </p>
    </>
  );
}
