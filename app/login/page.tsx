import Link from "next/link";
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
          Sign in to take a test and see your past results.
        </p>

        {isConfigured() ? (
          <AuthForm mode="login" next={next ?? "/dashboard"} />
        ) : (
          <SetupNotice />
        )}

        <p className="mt-5 text-center text-[13px] text-gray-600">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-rrb-banner hover:underline">
            Create an account
          </Link>
        </p>
      </main>
    </div>
  );
}
