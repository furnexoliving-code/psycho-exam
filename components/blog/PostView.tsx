import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/landing/LandingPage";
import { Markdown, headingsOf } from "@/components/blog/Markdown";
import { formatDate } from "@/lib/format-time";
import { readingMinutes, type Post, type PostSummary } from "@/lib/blog";
import { KIND_LABEL, rupees, type Package } from "@/lib/packages";

const Y = "#ff9933";

export interface PostInput {
  post: Post;
  /** The packages the article names, in the article's order; the up-sell one first when set. */
  packages: Package[];
  upsell: Package | null;
  /** The saving the up-sell package gives over buying the parts, in rupees; null when it is not a combo. */
  saving: number | null;
  related: PostSummary[];
  /** True when a signed-in student is reading; the buttons then go to the packages page, not sign-up. */
  signedIn: boolean;
  /** The free mock on offer, for the lead card. */
  freeMock: { name: string } | null;
}

/**
 * One article: the text with a table of contents, the FAQ, and beside it
 * the packages the author chose. The side column is the sale: the pushed
 * package first with its saving (up-sell), the rest after it, then the
 * free mock as the no-risk first step (cross-sell), then more articles.
 */
export function PostView({ post, packages, upsell, saving, related, signedIn, freeMock }: PostInput) {
  const headings = headingsOf(post.content);
  const buyHref = signedIn ? "/packages" : "/signup?next=/packages";
  return (
    <div className="bg-white text-gray-900">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        <nav aria-label="Breadcrumb" className="text-[12px] text-gray-500">
          <Link href="/" className="hover:underline">Home</Link> › <Link href="/blog" className="hover:underline">Articles</Link> › <span className="text-gray-700">{post.title}</span>
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_340px]">
          {/* ------------------------------ Article ------------------------------ */}
          <article className="min-w-0">
            <p className="text-[12px] font-bold uppercase tracking-[0.25em] text-[#c8102e]">{examLabel(post.exam)} · Psycho Test</p>
            <h1 className="mt-2 text-[32px] font-extrabold leading-[1.15] text-gray-900 sm:text-[40px]">{post.title}</h1>
            {post.excerpt && <p className="mt-3 text-[18px] leading-relaxed text-gray-600">{post.excerpt}</p>}
            <p className="mt-3 text-[13px] text-gray-500">
              By {post.author}{post.publishedAt ? ` · ${formatDate(post.publishedAt)}` : ""} · {readingMinutes(post.content)} min read
            </p>
            {post.coverImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.coverImageUrl} alt="" className="mt-6 w-full rounded-2xl border border-gray-200 object-cover" />
            )}

            {headings.length >= 3 && (
              <nav aria-label="In this article" className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-5">
                <p className="text-[12px] font-bold uppercase tracking-wider text-gray-500">In this article</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-[15px] text-[#0d2a6b]">
                  {headings.map((h) => (
                    <li key={h.id}><a href={`#${h.id}`} className="hover:underline">{h.text}</a></li>
                  ))}
                </ol>
              </nav>
            )}

            <div className="mt-2">
              <Markdown text={post.content} />
            </div>

            {/* In-text cross-sell: the free mock, where the reader is warmest. */}
            <aside className="mt-10 rounded-2xl bg-[#0d2a6b] px-6 py-6 text-white">
              <p className="text-[12px] font-bold uppercase tracking-[0.25em]" style={{ color: Y }}>Try it on the real screen</p>
              <h2 className="mt-1 text-[24px] font-extrabold">Sit one Full Mock free, today</h2>
              <p className="mt-1 text-[15px] text-[#c9d3e6]">
                All 5 tests of the CBAT in one sitting with the real timing, and your T-Score at the end. No package needed.
                <span className="block" lang="hi">पाँचों टेस्ट एक बार में, असली समय के साथ। कोई पैकेज नहीं।</span>
              </p>
              <Link href={signedIn ? "/mocks" : "/signup"} className="mt-4 inline-block rounded-md px-5 py-2.5 text-[14px] font-bold text-[#0d2a6b]" style={{ background: Y }}>
                {signedIn ? "Open the free mock →" : "Create free account →"}
              </Link>
            </aside>

            {post.faq.length > 0 && (
              <section className="mt-10">
                <h2 className="text-[26px] font-extrabold text-gray-900">Questions students ask</h2>
                <div className="mt-4 divide-y divide-gray-200 rounded-xl border border-gray-200">
                  {post.faq.map((f) => (
                    <details key={f.q} className="group px-5 py-4">
                      <summary className="cursor-pointer list-none text-[16px] font-semibold text-gray-900 marker:content-none">
                        <span className="mr-2 inline-block text-[#0d2a6b] transition group-open:rotate-90">▸</span>{f.q}
                      </summary>
                      <p className="mt-2 pl-6 text-[15px] leading-relaxed text-gray-700">{f.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {related.length > 0 && (
              <section className="mt-12">
                <h2 className="text-[22px] font-extrabold text-gray-900">Students also read</h2>
                <ul className="mt-4 grid gap-4 sm:grid-cols-3">
                  {related.map((r) => (
                    <li key={r.id} className="rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md">
                      <Link href={`/blog/${r.slug}`} className="text-[15px] font-bold text-[#0d2a6b] hover:underline">{r.title}</Link>
                      {r.excerpt && <p className="mt-1 line-clamp-3 text-[13px] text-gray-600">{r.excerpt}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </article>

          {/* ------------------------------ Side column ------------------------------ */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            {packages.length > 0 && (
              <div className="space-y-4">
                <p className="text-[12px] font-bold uppercase tracking-[0.25em] text-[#c8102e]">Prepare with Kautilya</p>
                {packages.map((p) => {
                  const pushed = upsell?.id === p.id;
                  return (
                    <section key={p.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${pushed ? "border-[#0d2a6b] ring-2 ring-[#0d2a6b]/15" : "border-gray-200"}`}>
                      {pushed && (
                        <span className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0d2a6b]" style={{ background: Y }}>
                          Recommended
                        </span>
                      )}
                      <p className={`${pushed ? "mt-2" : ""} text-[11px] font-bold uppercase tracking-wider text-gray-500`}>{KIND_LABEL[p.kind]}</p>
                      <h3 className="mt-0.5 text-[18px] font-extrabold leading-tight text-gray-900">{p.name}</h3>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-[28px] font-extrabold text-[#0d2a6b]">{rupees(p.priceInr)}</span>
                        {p.mrpInr && p.mrpInr > p.priceInr && <span className="text-[13px] text-gray-400 line-through">{rupees(p.mrpInr)}</span>}
                        <span className="text-[11px] text-gray-500">{p.validityDays ? `· ${p.validityDays} days` : "· no expiry"}</span>
                      </div>
                      {pushed && saving !== null && saving > 0 && (
                        <p className="mt-1 text-[12px] font-semibold text-green-700">Save {rupees(saving)} against buying both separately</p>
                      )}
                      {p.description && <p className="mt-2 text-[13px] text-gray-600">{p.description}</p>}
                      <Link href={buyHref} className={`mt-3 block rounded-md px-4 py-2.5 text-center text-[14px] font-bold ${pushed ? "bg-[#0d2a6b] text-white hover:bg-[#0a2158]" : "border border-[#0d2a6b] text-[#0d2a6b] hover:bg-[#eef2fb]"}`}>
                        {pushed ? "Get this package" : "See package"}
                      </Link>
                    </section>
                  );
                })}
              </div>
            )}

            <section className={`${packages.length ? "mt-4" : ""} rounded-2xl border-2 border-dashed border-green-400 bg-green-50 p-5`}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-green-700">Free · ₹0</p>
              <h3 className="mt-0.5 text-[18px] font-extrabold text-gray-900">{freeMock?.name ?? "One Full Mock Test"}</h3>
              <p className="mt-1 text-[13px] text-gray-700">All 5 tests, hall order, real timing, your T-Score. Just a free account.</p>
              <Link href={signedIn ? "/mocks" : "/signup"} className="mt-3 block rounded-md bg-green-600 px-4 py-2.5 text-center text-[14px] font-bold text-white hover:bg-green-700">
                {signedIn ? "Open the free mock" : "Create free account"}
              </Link>
            </section>

            <p className="mt-4 text-[12px] text-gray-500">
              Kautilya Classes · Railway Psycho Test Portal · as per RDSO pattern. <Link href="/packages" className="underline">All packages</Link>.
            </p>
          </aside>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

export function examLabel(exam: string): string {
  return exam === "asm" ? "RRB ASM / Station Master" : exam === "train-operator" ? "Train Operator" : "RRB ALP";
}
