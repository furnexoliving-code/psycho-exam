import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { getProfile, isConfigured } from "@/lib/auth";
import { AuthForm } from "./AuthForm";
import { SetupNotice } from "./SetupNotice";

/**
 * Where to go after signing in. Only a path on this site is honoured: the
 * value comes off the URL, and a link that reads
 * /login?next=https://elsewhere would otherwise send a freshly signed-in
 * student anywhere at all.
 */
function safeNext(next: string | undefined): string {
  // A path on this site starts with one slash and nothing that a browser
  // could read as a host: not a second slash, and no backslash anywhere —
  // the URL parser turns "/\evil.com" into https://evil.com/.
  if (!next || !/^\/(?![\/\\])/.test(next) || next.includes("\\")) return "/dashboard";
  return next;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const target = safeNext(next);

  // Already signed in: there is nothing to do here.
  if (isConfigured() && (await getProfile())) redirect(target);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-5 py-10">
        <h1 className="text-center text-2xl font-bold text-gray-900">Candidate Login</h1>
        <p className="mt-1 text-center text-[13px] text-gray-600">
          Sign in with the mobile number registered with the institute.
        </p>

        {error === "inactive" && (
          <p
            role="alert"
            className="mt-5 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-amber-900"
          >
            This account has been switched off by the institute. Ask at the
            institute if you think that is a mistake.
          </p>
        )}

        {isConfigured() ? <AuthForm next={target} /> : <SetupNotice />}

        <p className="mt-5 rounded border border-gray-300 bg-white px-4 py-3 text-center text-[13px] text-gray-600">
          Accounts are issued by KAUTILYA CLASSES. If you cannot sign in, ask at
          the institute for your mobile number and password.
        </p>
      </main>
    </div>
  );
}
