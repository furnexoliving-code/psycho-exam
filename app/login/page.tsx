import { SiteHeader } from "@/components/SiteHeader";
import { isConfigured } from "@/lib/auth";
import { AuthForm } from "./AuthForm";
import { SetupNotice } from "./SetupNotice";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-5 py-10">
        <h1 className="text-center text-2xl font-bold text-gray-900">Candidate Login</h1>
        <p className="mt-1 text-center text-[13px] text-gray-600">
          Sign in with the mobile number registered with the institute.
        </p>

        {isConfigured() ? (
          <AuthForm next={next ?? "/dashboard"} />
        ) : (
          <SetupNotice />
        )}

        <p className="mt-5 rounded border border-gray-300 bg-white px-4 py-3 text-center text-[13px] text-gray-600">
          Accounts are issued by KAUTILYA CLASSES. If you cannot sign in, ask at
          the institute for your mobile number and password.
        </p>
      </main>
    </div>
  );
}
