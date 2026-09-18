import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { isConfigured } from "@/lib/auth";
import { AuthForm } from "../login/AuthForm";
import { SetupNotice } from "../login/SetupNotice";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-5 py-10">
        <h1 className="text-center text-2xl font-bold text-gray-900">Create Account</h1>
        <p className="mt-1 text-center text-[13px] text-gray-600">
          Register once, then take any published test.
        </p>

        {isConfigured() ? <AuthForm mode="signup" next="/dashboard" /> : <SetupNotice />}

        <p className="mt-5 text-center text-[13px] text-gray-600">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-rrb-banner hover:underline">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
