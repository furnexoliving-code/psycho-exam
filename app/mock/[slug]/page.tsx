import Link from "next/link";
import { notFound } from "next/navigation";
import { StudentHeader } from "@/components/StudentHeader";
import { photoUrlOf } from "@/lib/photo";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format-time";
import { BATTERIES } from "@/lib/wt/categories";
import { currentMockStep, latestMockResult, loadMock, mockAttemptsUsed, mockMinutes, mockStatus, mockUnlockedFor } from "@/lib/wt/mock";
import { STAGES } from "@/lib/wt/plan";
import { leaveMock } from "../actions";
import { examSettings } from "@/lib/settings";

/**
 * The door to a Full Mock: what it holds, how long it runs, what is left,
 * and the Start button. A sitting already open shows Continue instead.
 */
export default async function MockPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; left?: string }>;
}) {
  const { slug } = await params;
  const { error, left } = await searchParams;
  const who = await requireUser(`/mock/${slug}`);
  const loaded = await loadMock(slug);
  if (!loaded || !loaded.mock.isPublished) notFound();
  const { mock, papers } = loaded;

  const [current, used, latest, unlocked] = await Promise.all([
    currentMockStep(who.id),
    mockAttemptsUsed(mock.id, who.id),
    latestMockResult(mock.id, who.id),
    mockUnlockedFor(who.id, papers),
  ]);
  const status = mockStatus(mock);
  const exam = await examSettings();
  const inThis = current && current.mock.id === mock.id ? current : null;
  const inOther = current && current.mock.id !== mock.id ? current : null;
  const spent = mock.maxAttempts !== null && used >= mock.maxAttempts;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <StudentHeader name={who.full_name || "Candidate"} active="mocks" photoUrl={photoUrlOf(who)} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-6">
        <Link href="/dashboard" className="text-[13px] font-semibold text-rrb-banner hover:underline">
          ← Dashboard
        </Link>

        <div className="mt-3 rounded-2xl bg-gradient-to-r from-[#0d2a6b] to-[#1d4ed8] px-6 py-6 text-white shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">Full Mock · as per RDSO pattern</div>
          <h1 className="mt-1 text-[24px] font-bold">{mock.name}</h1>
          <p className="mt-1 text-[13px] text-white/85">
            {papers.length} tests · about {mockMinutes(mock, papers)} minutes · gap {mock.gapMin} min between tests
            {mock.maxAttempts !== null && <> · {Math.max(0, mock.maxAttempts - used)} of {mock.maxAttempts} attempts left</>}
          </p>
          {(mock.opensAt || mock.closesAt) && (
            <p className="mt-1 text-[12px] text-white/75">
              {mock.opensAt && <>Opens {formatDateTime(mock.opensAt)}</>}
              {mock.opensAt && mock.closesAt && " · "}
              {mock.closesAt && <>Closes {formatDateTime(mock.closesAt)}</>}
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-[13px] text-red-800">
            {error}
          </p>
        )}
        {left && (
          <p className="mt-4 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
            You left the mock. Nothing was scored and no attempt was spent.
          </p>
        )}

        <section className="mt-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-[15px] font-bold text-gray-900">
            The five tests, in the hall&apos;s order <span className="font-normal text-gray-500" lang="hi">/ पाँचों परीक्षण, परीक्षा हॉल के क्रम में</span>
          </h2>
          <ol className="mt-3 divide-y divide-gray-100">
            {papers.map((paper, i) => {
              const battery = BATTERIES.find((b) => b.id === paper.battery);
              const done = inThis ? i < inThis.step : false;
              const now = inThis ? i === inThis.step : false;
              return (
                <li key={paper.id} className="flex items-center gap-3 py-2.5 text-[13px]">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold ${
                    done ? "bg-green-100 text-green-800" : now ? "bg-[#1d4ed8] text-white" : "bg-gray-100 text-gray-700"
                  }`}>
                    {done ? "✓" : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-gray-900">
                      Test {paper.battery} · {battery?.title ?? paper.category}
                    </span>
                    <span className="block text-[12px] text-gray-500">
                      {paper.displayName} · {paper.questionCount} questions · {paper.instructionTimeMin} min reading + {paper.timeLimitMin} min test
                    </span>
                  </span>
                  {now && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">On now</span>}
                </li>
              );
            })}
          </ol>
        </section>

        <section className="mt-4 rounded-xl border border-gray-200 bg-white p-5 text-[13px] text-gray-700 shadow-sm">
          <h2 className="text-[15px] font-bold text-gray-900">
            How it runs <span className="font-normal text-gray-500" lang="hi">/ यह कैसे चलेगा</span>
          </h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              Start opens the general instructions and the declaration, as in the hall; the first test begins when you press &ldquo;I am ready to begin&rdquo;.
              <span className="block text-[12px] text-gray-500" lang="hi">Start दबाने पर पहले सामान्य निर्देश और घोषणा आएगी, परीक्षा हॉल की तरह; &ldquo;I am ready to begin&rdquo; दबाने पर पहला परीक्षण शुरू होगा।</span>
            </li>
            <li>
              Each test opens with its own instruction screen and its own clock, exactly as in the hall.
              <span className="block text-[12px] text-gray-500" lang="hi">हर परीक्षण की अपनी निर्देश स्क्रीन और अपनी घड़ी होगी, बिल्कुल परीक्षा हॉल की तरह।</span>
            </li>
            <li>
              After you submit a test there is a {mock.gapMin}-minute break with the Exam Summary, then the next test opens by itself. There is no way back to a finished test.
              <span className="block text-[12px] text-gray-500" lang="hi">एक परीक्षण जमा करने के बाद {mock.gapMin} मिनट का अंतराल होगा, फिर अगला परीक्षण स्वतः खुलेगा। पूरे हो चुके परीक्षण पर वापस नहीं जा सकते।</span>
            </li>
            <li>
              Your scorecard comes at the end: every test&apos;s T-score, a score out of 30, and whether every battery cleared T {mock.cutOffT}. Aim for T {exam.targetT} in each.
              <span className="block text-[12px] text-gray-500" lang="hi">स्कोरकार्ड अंत में मिलेगा: हर परीक्षण का T-स्कोर, 30 में से अंक, और हर बैटरी में T {mock.cutOffT} पार हुआ या नहीं। हर बैटरी में T {exam.targetT} का लक्ष्य रखें।</span>
            </li>
            <li>
              If the browser closes mid-way, sign in again and press Continue: the mock picks up where the clock says.
              <span className="block text-[12px] text-gray-500" lang="hi">बीच में ब्राउज़र बंद हो जाए तो दोबारा साइन इन करके Continue दबाएँ: मॉक घड़ी के अनुसार वहीं से चलेगा।</span>
            </li>
          </ul>
        </section>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {inThis ? (
            <>
              <Link
                href={`/watch-table/${inThis.paper.slug}`}
                className="rounded-lg bg-[#1d4ed8] px-6 py-2.5 text-[14px] font-bold text-white shadow hover:bg-[#1e40af]"
              >
                Continue · Test {inThis.step + 1} of {inThis.papers.length} ▶
              </Link>
              <form action={leaveMock}>
                <input type="hidden" name="slug" value={slug} />
                <button type="submit" className="rounded-lg border border-gray-400 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-100">
                  Leave this mock
                </button>
              </form>
            </>
          ) : inOther ? (
            <p className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
              You are in the middle of <b>{inOther.mock.name}</b>.{" "}
              <Link href={`/mock/${inOther.mock.slug}`} className="font-semibold underline">Finish it first</Link>.
            </p>
          ) : status === "live" && !spent && !unlocked ? (
            <p className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
              🔒 This Full Mock opens once every battery in it is at <b>T-Score: {STAGES.pass}</b> or above in sectional practice.
              Your dashboard shows which battery still needs work.
              <span className="block text-[12px]" lang="hi">यह फुल मॉक तब खुलेगा जब हर बैटरी में सेक्शनल अभ्यास में T-स्कोर {STAGES.pass} या अधिक आ जाए।</span>
            </p>
          ) : status === "live" && !spent ? (
            <Link
              href={`/mock/${slug}/begin`}
              className="rounded-lg bg-[#1d4ed8] px-6 py-2.5 text-[14px] font-bold text-white shadow hover:bg-[#1e40af]"
            >
              Start Full Mock ▶
            </Link>
          ) : (
            <p className="rounded border border-gray-300 bg-white px-4 py-3 text-[13px] text-gray-700">
              {spent
                ? "You have used every attempt of this mock."
                : status === "scheduled"
                  ? `This mock opens ${mock.opensAt ? formatDateTime(mock.opensAt) : "later"}.`
                  : "This mock is over."}
            </p>
          )}
          {latest && (
            <Link href={`/mock/${slug}/result`} className="rounded-lg border border-gray-400 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-800 hover:bg-gray-100">
              My last scorecard →
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
