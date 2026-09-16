import { notFound } from "next/navigation";
import { ExamBanner } from "@/components/ExamBanner";
import { PaletteLegend } from "@/components/PaletteLegend";
import { getTest } from "@/lib/tests";
import { StartExamButton } from "./StartExamButton";

export default async function InstructionsPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;
  const test = getTest(testId);
  if (!test) notFound();

  const totalQuestions = test.sections.reduce((n, s) => n + s.questions.length, 0);
  const totalMinutes = test.sections.reduce((n, s) => n + s.timeLimitMin, 0);

  return (
    <div className="flex min-h-screen flex-col">
      <ExamBanner />

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-6">
        <h1 className="border-b-2 border-gray-300 pb-2 text-2xl font-bold text-gray-900">
          General Instructions:
        </h1>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Stat label="Tests" value={String(test.sections.length)} />
          <Stat label="Total Questions" value={String(totalQuestions)} />
          <Stat label="Total Duration" value={`${totalMinutes} min`} />
        </div>

        <ol className="mt-6 list-decimal space-y-3 pl-6 text-[14px] leading-relaxed text-gray-800">
          {test.generalInstructions.map((line, i) => (
            <li key={i}>
              <span>{line.en}</span>
              <span className="mt-1 block text-gray-600" lang="hi">
                {line.hi}
              </span>
            </li>
          ))}
        </ol>

        <section className="mt-8">
          <h2 className="mb-3 text-[15px] font-bold text-gray-900">
            The Question Palette uses the following symbols:
          </h2>
          <div className="rounded border border-gray-300 bg-gray-50 p-4">
            <PaletteLegend />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-[15px] font-bold text-gray-900">
            Tests in this paper
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-rrb-banner text-left text-white">
                  <th className="border border-gray-300 px-3 py-2">#</th>
                  <th className="border border-gray-300 px-3 py-2">Test</th>
                  <th className="border border-gray-300 px-3 py-2">Questions</th>
                  <th className="border border-gray-300 px-3 py-2">Time</th>
                  <th className="border border-gray-300 px-3 py-2">Evaluated</th>
                </tr>
              </thead>
              <tbody>
                {test.sections.map((section, i) => (
                  <tr key={section.id} className="odd:bg-white even:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2">{i + 1}</td>
                    <td className="border border-gray-300 px-3 py-2">
                      <span className="font-semibold text-gray-900">
                        {section.name.en}
                      </span>
                      <span className="ml-2 text-gray-600" lang="hi">
                        {section.name.hi}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {section.questions.length}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {section.timeLimitMin} min
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {section.scored ? "Scored" : "Profile only"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-8 flex items-center justify-between border-t border-gray-300 pt-4">
          <p className="max-w-lg text-[12px] text-gray-600">
            Once you begin, each test runs on its own timer and closes when the
            time is up.
          </p>
          <StartExamButton testId={test.id} />
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-gray-300 bg-gray-50 px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
