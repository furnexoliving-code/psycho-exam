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
  if (!next || !next.startsWith("/")) return "/dashboard";
  // Judged by the same parser the browser uses, so every spelling of "another
  // site" — //evil.com, /\evil.com, a tab or newline before the host — is
  // caught by the one rule: it must resolve to THIS origin.
  try {
    const url = new URL(next, "http://x");
    if (url.origin !== "http://x") return "/dashboard";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/dashboard";
  }
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
