import type { Metadata } from "next";
import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/landing/LandingPage";
import { examLabel } from "@/components/blog/PostView";
import { formatDate } from "@/lib/format-time";
import { listPublishedPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Railway Psycho Test Articles: ALP CBAT tips, T-Score, test guides | Kautilya Classes",
  description: "Guides for the RRB ALP psycho test (CBAT): how each of the 5 tests works, what T-Score 42 means, how to prepare, and mistakes to avoid. By Kautilya Classes.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://kautilyaonline.com/blog" },
};

export const revalidate = 300;

/**
 * The articles, newest first. Nothing in the portal's menus leads here;
 * search engines reach it through the sitemap and the footer, and a
 * reader through a search result.
 */
export default async function BlogIndex() {
  const posts = await listPublishedPosts();
  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <PublicHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:py-14">
        <p className="text-[12px] font-bold uppercase tracking-[0.25em] text-[#c8102e]">Articles · लेख</p>
        <h1 className="mt-2 text-[32px] font-extrabold sm:text-[40px]">Railway psycho test guides</h1>
        <p className="mt-2 max-w-2xl text-[16px] text-gray-600">How the five tests of the CBAT work, what the T-Score means, and how to prepare. Written by the Kautilya Classes team.</p>
        {posts.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed border-gray-300 p-10 text-center text-[14px] text-gray-500">Articles are on their way.</p>
        ) : (
          <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <li key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md">
                {p.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.coverImageUrl} alt="" className="h-44 w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-[#0d2a6b] text-[12px] font-bold uppercase tracking-[0.25em] text-[#ff9933]">{examLabel(p.exam)} · Psycho Test</div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{examLabel(p.exam)}{p.publishedAt ? ` · ${formatDate(p.publishedAt)}` : ""}</p>
                  <h2 className="mt-1 text-[19px] font-extrabold leading-tight">
                    <Link href={`/blog/${p.slug}`} className="hover:underline">{p.title}</Link>
                  </h2>
                  {p.excerpt && <p className="mt-2 line-clamp-3 flex-1 text-[14px] text-gray-600">{p.excerpt}</p>}
                  <Link href={`/blog/${p.slug}`} className="mt-3 text-[13px] font-bold text-[#0d2a6b] hover:underline">Read →</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
