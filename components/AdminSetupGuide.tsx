import Link from "next/link";

/**
 * Shown at /admin while Supabase is unconfigured. Without this the guard just
 * bounced to a login page that could not work, which looked like the admin
 * panel did not exist.
 */
export function AdminSetupGuide({ missing }: { missing: string[] }) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
      <h1 className="text-xl font-bold text-gray-900">Admin panel — setup needed</h1>
      <p className="mt-1 text-[14px] text-gray-600">
        The panel is built and ready. It needs a database before it can store your tests,
        questions and student results.
      </p>

      <div className="mt-4 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
        <p className="font-semibold">Not set yet:</p>
        <ul className="mt-1 list-disc pl-5">
          {missing.map((name) => (
            <li key={name}>
              <code className="rounded bg-amber-100 px-1">{name}</code>
            </li>
          ))}
        </ul>
      </div>

      <ol className="mt-6 space-y-5">
        <Step n={1} title="Create a Supabase project">
          Go to <Ext href="https://supabase.com">supabase.com</Ext>, sign in with GitHub
          and create a new project. Pick the region closest to your students. Note the
          database password somewhere safe.
        </Step>

        <Step n={2} title="Create the tables">
          In Supabase open <strong>SQL Editor → New query</strong>. Paste the whole of{" "}
          <code className="rounded bg-gray-200 px-1">supabase/schema.sql</code> from this
          repository and press <strong>Run</strong>. It is safe to run more than once.
        </Step>

        <Step n={3} title="Copy the three keys">
          In Supabase open <strong>Settings → API</strong>. You need the{" "}
          <strong>Project URL</strong>, the <strong>anon public</strong> key and the{" "}
          <strong>service_role</strong> key.
          <span className="mt-2 block rounded border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-800">
            The <strong>service_role</strong> key bypasses every security rule. Put it
            only in your hosting provider&apos;s environment variables. Never paste it in
            a chat, an email, or into the code.
          </span>
        </Step>

        <Step n={4} title="Add them to your hosting environment">
          On Vercel: <strong>Project → Settings → Environment Variables</strong>. Add the
          three names listed above, then <strong>Deployments → ⋯ → Redeploy</strong>.
          Running locally instead? Copy{" "}
          <code className="rounded bg-gray-200 px-1">.env.example</code> to{" "}
          <code className="rounded bg-gray-200 px-1">.env.local</code> and fill it in.
        </Step>

        <Step n={5} title="Make yourself the admin">
          Public sign-up is off — accounts are issued from this panel. Create the
          first admin by running this in the Supabase SQL editor, once an account
          exists:
          <pre className="mt-2 overflow-x-auto rounded bg-gray-900 p-3 text-[12px] text-gray-100">
{`update public.profiles set role = 'admin'
where id = (select id from auth.users
            where email = 'you@example.com');`}
          </pre>
          Reload this page and the panel opens.
        </Step>
      </ol>

      <div className="mt-8 border-t border-gray-300 pt-4">
        <p className="text-[13px] text-gray-600">
          The sample papers work without any of this — nothing is saved, but the exam
          itself runs.
        </p>
        <Link
          href="/"
          className="mt-3 inline-block rounded border border-gray-400 bg-white px-5 py-2 text-[13px] font-semibold text-gray-800 hover:bg-gray-100"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-800 text-[13px] font-bold text-white">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-[14px] font-bold text-gray-900">{title}</h2>
        <div className="mt-1 text-[13px] leading-relaxed text-gray-700">{children}</div>
      </div>
    </li>
  );
}

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-semibold text-rrb-banner hover:underline"
    >
      {children}
    </a>
  );
}
