/** Shown until the Supabase environment variables are configured. */
export function SetupNotice() {
  return (
    <div className="mt-6 rounded border border-amber-300 bg-amber-50 p-4 text-[13px] text-amber-900">
      <p className="font-semibold">Login is not configured yet.</p>
      <p className="mt-2">
        Add <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in
        the project&apos;s environment variables, then redeploy.
      </p>
      <p className="mt-2">
        See <code className="rounded bg-amber-100 px-1">.env.example</code> and{" "}
        <code className="rounded bg-amber-100 px-1">supabase/schema.sql</code> in the repo.
      </p>
    </div>
  );
}
