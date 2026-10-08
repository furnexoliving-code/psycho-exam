import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format-time";
import { listPostsForAdmin } from "@/lib/blog";
import { PendingButton } from "@/components/admin/PendingButton";
import { createPost } from "./actions";

export default async function BlogAdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin("/admin/blog");
  const [posts, { error }] = await Promise.all([listPostsForAdmin(), searchParams]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">Blog</h1>
        <Link href="/blog" target="_blank" className="ml-auto rounded border border-gray-400 bg-white px-4 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100">See the articles page ↗</Link>
      </div>
      <p className="mt-1 text-[13px] text-gray-600">
        Articles for search engines: a student who searches &ldquo;ALP psycho test&rdquo; lands on one, reads, and sees the packages you chose beside it.
        Nothing in the portal&apos;s menus points at the blog; the footer and the sitemap do.
      </p>
      {error && <p role="alert" className="mt-3 rounded border border-red-300 bg-red-50 px-4 py-2 text-[13px] text-red-800">{error}</p>}

      <form action={createPost} className="mt-4 flex flex-wrap items-end gap-2 rounded border border-gray-300 bg-white p-4">
        <label className="block min-w-[280px] flex-1">
          <span className="mb-1 block text-[12px] font-semibold text-gray-700">New article · title</span>
          <input name="title" required placeholder="RRB ALP Psycho Test 2026: all 5 tests explained" className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]" />
        </label>
        <label className="block min-w-[200px]">
          <span className="mb-1 block text-[12px] font-semibold text-gray-700">Address (slug)</span>
          <input name="slug" placeholder="blank: from the title" className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]" />
        </label>
        <PendingButton pendingLabel="Creating…" className="rounded bg-indigo-800 px-5 py-2 text-[13px] font-semibold text-white hover:bg-indigo-900 disabled:opacity-60">Create draft</PendingButton>
      </form>

      <table className="mt-5 w-full border-collapse text-[13px]">
        <thead>
          <tr className="bg-gray-100 text-left text-gray-700">
            <th className="border border-gray-300 px-3 py-2">Article</th>
            <th className="border border-gray-300 px-3 py-2">Exam</th>
            <th className="border border-gray-300 px-3 py-2">Status</th>
            <th className="border border-gray-300 px-3 py-2">Updated</th>
          </tr>
        </thead>
        <tbody>
          {posts.length === 0 && <tr><td colSpan={4} className="border border-gray-300 px-3 py-6 text-center text-gray-500">No articles yet. Run supabase/blog.sql once, then create the first draft above.</td></tr>}
          {posts.map((p) => (
            <tr key={p.id} className="bg-white even:bg-gray-50">
              <td className="border border-gray-300 px-3 py-2">
                <Link href={`/admin/blog/${p.slug}`} className="font-semibold text-rrb-banner hover:underline">{p.title}</Link>
                <span className="block text-[11px] text-gray-500">/blog/{p.slug}</span>
              </td>
              <td className="border border-gray-300 px-3 py-2 uppercase">{p.exam}</td>
              <td className="border border-gray-300 px-3 py-2">
                <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${p.isPublished ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}>{p.isPublished ? "Published" : "Draft"}</span>
              </td>
              <td className="border border-gray-300 px-3 py-2">{formatDateTime(p.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
