import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { VersionBar } from "@/components/VersionBar";
import { isConfigured } from "@/lib/auth";
import { listTests as bundledTests, DEFAULT_TEST_ID } from "@/lib/tests";

/**
 * The portal's front door. Previously this redirected straight into the sample
 * exam, which left the login and admin areas with no way in at all.
 */
export default function Home() {
  const configured = isConfigured();
  const samples = bundledTests();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
        <h1 className="text-2xl font-bold text-gray-900">
          RRB ALP Aptitude Test (CBAT) — Mock Portal
        </h1>
        <p className="mt-1 text-[14px] text-gray-600">
          Practise the computer based aptitude test in the same format as the real
          examination.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card
            title="Take a test"
            body="Open the sample paper and sit it exactly as you would in the exam hall."
            href={`/exam/${DEFAULT_TEST_ID}`}
            cta="Start now"
            tone="primary"
          />
          <Card
            title="Student login"
            body={
              configured
                ? "Sign in to see published tests and keep a record of your results."
                : "Accounts are not switched on yet. Set up the database to enable them."
            }
            href="/login"
            cta={configured ? "Sign in" : "See setup steps"}
          />
          <Card
            title="Admin panel"
            body="Create tests, add and edit questions, and see how students have done."
            href="/admin"
            cta="Open admin"
          />
        </div>

        {!configured && (
          <div className="mt-6 rounded border border-amber-300 bg-amber-50 p-4 text-[13px] text-amber-900">
            <p className="font-semibold">
              The admin panel and student accounts need a database.
            </p>
            <p className="mt-1">
              Until it is connected, the sample papers below still work, but nothing can
              be saved. Open the admin panel for the setup checklist.
            </p>
          </div>
        )}

        <section className="mt-8">
          <h2 className="mb-3 text-[15px] font-bold text-gray-900">Sample papers</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {samples.map((test) => (
              <div
                key={test.id}
                className="flex flex-col rounded border border-gray-300 bg-white p-4"
              >
                <h3 className="text-[14px] font-bold text-gray-900">{test.name.en}</h3>
                <p className="text-[12px] text-gray-500" lang="hi">
                  {test.name.hi}
                </p>
                <p className="mt-1 text-[12px] text-gray-500">
                  {test.sections.reduce((n, s) => n + s.questions.length, 0)} questions ·{" "}
                  {test.sections.reduce((n, s) => n + s.timeLimitMin, 0)} min ·{" "}
                  {test.sections.length} test{test.sections.length === 1 ? "" : "s"}
                </p>
                <Link href={`/exam/${test.id}`} className="mt-auto pt-4">
                  <span className="block rounded bg-[#1d7fd7] px-4 py-2 text-center text-[13px] font-semibold text-white hover:bg-[#1668b0]">
                    Open
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>

      <VersionBar />
    </div>
  );
}

function Card({
  title,
  body,
  href,
  cta,
  tone,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
  tone?: "primary";
}) {
  return (
    <div className="flex flex-col rounded border border-gray-300 bg-white p-5">
      <h2 className="text-[15px] font-bold text-gray-900">{title}</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-gray-600">{body}</p>
      <Link href={href} className="mt-auto pt-4">
        <span
          className={`block rounded px-4 py-2 text-center text-[13px] font-semibold ${
            tone === "primary"
              ? "bg-indigo-800 text-white hover:bg-indigo-900"
              : "border border-gray-400 bg-white text-gray-800 hover:bg-gray-100"
          }`}
        >
          {cta}
        </span>
      </Link>
    </div>
  );
}
