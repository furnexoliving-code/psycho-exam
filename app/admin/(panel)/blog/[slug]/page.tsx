import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { faqToText, loadPostLive } from "@/lib/blog";
import { EXAMS, KIND_LABEL, listAllPackages, rupees } from "@/lib/packages";
import { SaveForm } from "@/components/admin/SaveForm";
import { RowForm } from "@/components/admin/RowForm";
import { PendingButton } from "@/components/admin/PendingButton";
import { deletePost, savePost } from "../actions";

const field = "w-full rounded border border-gray-400 px-3 py-2 text-[13px]";

export default async function PostEditor({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireAdmin(`/admin/blog/${slug}`);
  const [post, packages] = await Promise.all([loadPostLive(slug), listAllPackages()]);
  if (!post) notFound();
  const position = new Map(post.packageSlugs.map((s, i) => [s, i + 1]));

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/blog" className="text-[13px] font-semibold text-rrb-banner hover:underline">← Blog</Link>
        <h1 className="text-xl font-bold text-gray-900">{post.title}</h1>
        <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${post.isPublished ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}>{post.isPublished ? "Published" : "Draft"}</span>
        <Link href={`/blog/${slug}?preview=1`} target="_blank" className="ml-auto rounded border border-gray-400 bg-white px-4 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100">Preview ↗</Link>
      </div>

      <SaveForm action={savePost} submitLabel="Save the article" className="mt-4 rounded border border-gray-300 bg-white p-5">
        <input type="hidden" name="slug" value={slug} />

        <h2 className="text-[13px] font-bold uppercase tracking-wide text-gray-500">1 · The article</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Title (the H1; put the search phrase in it)</span>
            <input name="title" required defaultValue={post.title} className={field} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Summary (one or two lines under the title, and on the articles page)</span>
            <textarea name="excerpt" rows={2} defaultValue={post.excerpt} className={field} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Exam</span>
            <select name="exam" defaultValue={post.exam} className={field}>
              {EXAMS.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Author</span>
            <input name="author" defaultValue={post.author} className={field} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Cover picture (web address, 1200×630 works best)</span>
            <input name="cover_image_url" defaultValue={post.coverImageUrl ?? ""} placeholder="https://…/picture.jpg" className={field} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Text (Markdown)</span>
            <textarea name="content" rows={24} defaultValue={post.content} className={`${field} font-mono text-[12.5px] leading-relaxed`} placeholder={"## A heading\n\nA paragraph. **Bold**, *italic*, [a link](/packages).\n\n- a bullet\n- another\n\n1. a numbered step\n\n> a quote\n\n![picture](https://…/img.jpg)"} />
            <span className="mt-1 block text-[11px] text-gray-500">## heading · **bold** · *italic* · [text](/packages) link · - bullet · 1. step · &gt; quote · ![alt](https://…) picture · --- line</span>
          </label>
        </div>

        <h2 className="mt-8 text-[13px] font-bold uppercase tracking-wide text-gray-500">2 · Packages beside the article (cross-sell &amp; up-sell)</h2>
        <p className="mt-1 text-[12px] text-gray-600">
          Give a position (1, 2, 3 …) to each package to show; blank hides it. The <b>recommended</b> one is shown first with a &ldquo;Recommended&rdquo; mark and, for a combo, the saving against buying the parts. The free mock card is always there.
        </p>
        <table className="mt-3 w-full max-w-3xl border-collapse text-[13px]">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-700">
              <th className="border border-gray-300 px-3 py-2">Package</th>
              <th className="border border-gray-300 px-3 py-2">Price</th>
              <th className="border border-gray-300 px-3 py-2">Position</th>
              <th className="border border-gray-300 px-3 py-2">Recommended</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((p) => (
              <tr key={p.id} className="bg-white even:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2">
                  <span className="font-semibold text-gray-900">{p.name}</span>
                  <span className="block text-[11px] text-gray-500">{p.exam.toUpperCase()} · {KIND_LABEL[p.kind]}{p.isPublished ? "" : " · not on sale"}</span>
                </td>
                <td className="border border-gray-300 px-3 py-2 tabular-nums">{rupees(p.priceInr)}</td>
                <td className="border border-gray-300 px-3 py-2">
                  <input name={`pos_${p.slug}`} type="number" min={1} max={20} defaultValue={position.get(p.slug) ?? ""} placeholder="—" className="w-20 rounded border border-gray-400 px-2 py-1 text-[13px]" />
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  <input type="radio" name="upsell" value={p.slug} defaultChecked={post.upsellSlug === p.slug} className="h-4 w-4" />
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={3} className="border border-gray-300 px-3 py-2 text-[12px] text-gray-500">No recommended package</td>
              <td className="border border-gray-300 px-3 py-2"><input type="radio" name="upsell" value="" defaultChecked={!post.upsellSlug} className="h-4 w-4" /></td>
            </tr>
          </tbody>
        </table>

        <h2 className="mt-8 text-[13px] font-bold uppercase tracking-wide text-gray-500">3 · Search engines</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Search title (blank: the title + Kautilya Classes; keep under 60 characters)</span>
            <input name="meta_title" defaultValue={post.metaTitle} maxLength={120} className={field} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Keywords (comma separated)</span>
            <input name="keywords" defaultValue={post.keywords} placeholder="ALP psycho test, CBAT, T-score" className={field} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Search description (blank: the summary; 150 to 160 characters)</span>
            <textarea name="meta_description" rows={2} maxLength={300} defaultValue={post.metaDescription} className={field} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">FAQ at the end (also given to Google as FAQ). One pair per block: a line starting &ldquo;Q:&rdquo; then a line starting &ldquo;A:&rdquo;.</span>
            <textarea name="faq" rows={6} defaultValue={faqToText(post.faq)} placeholder={"Q: Is T-Score 42 compulsory in every test?\nA: Yes. ..."} className={`${field} font-mono text-[12.5px]`} />
          </label>
        </div>

        <h2 className="mt-8 text-[13px] font-bold uppercase tracking-wide text-gray-500">4 · Publish</h2>
        <label className="mt-2 flex items-center gap-2 text-[13px] text-gray-800">
          <input type="checkbox" name="is_published" defaultChecked={post.isPublished} className="h-4 w-4" />
          Published — live at /blog/{slug}, in the sitemap, open to search engines
        </label>
      </SaveForm>

      <RowForm action={deletePost} className="mt-6">
        <input type="hidden" name="slug" value={slug} />
        <PendingButton pendingLabel="Deleting…" confirm={`Delete the article "${post.title}"? This cannot be undone.`} className="text-[12px] font-semibold text-red-700 hover:underline disabled:opacity-60">Delete this article</PendingButton>
      </RowForm>
    </>
  );
}
