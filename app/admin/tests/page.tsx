import Link from "next/link";
import { listTests } from "@/lib/db";

export default async function AdminTestsPage() {
  const tests = await listTests(true);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Tests &amp; Questions</h1>
        <Link
          href="/admin/tests/new"
          className="rounded bg-indigo-800 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-900"
        >
          + New test
        </Link>
      </div>

      {tests.length === 0 ? (
        <p className="mt-6 rounded border border-gray-300 bg-white p-6 text-center text-[14px] text-gray-600">
          No tests yet. Create your first one.
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-rrb-banner text-left text-white">
                <th className="border border-gray-300 px-3 py-2">Test</th>
                <th className="border border-gray-300 px-3 py-2">Questions</th>
                <th className="border border-gray-300 px-3 py-2">Duration</th>
                <th className="border border-gray-300 px-3 py-2">Access</th>
                <th className="border border-gray-300 px-3 py-2">Status</th>
                <th className="border border-gray-300 px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr key={test.id} className="bg-white even:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2">
                    <div className="font-semibold text-gray-900">{test.display_name}</div>
                    <div className="text-[11px] text-gray-500">/{test.slug}</div>
                  </td>
                  <td className="border border-gray-300 px-3 py-2">{test.question_count}</td>
                  <td className="border border-gray-300 px-3 py-2">{test.total_minutes} min</td>
                  <td className="border border-gray-300 px-3 py-2">
                    {test.is_free ? "Free" : "Paid"}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                        test.is_published
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {test.is_published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <Link
                      href={`/admin/tests/${test.id}`}
                      className="font-semibold text-rrb-banner hover:underline"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
