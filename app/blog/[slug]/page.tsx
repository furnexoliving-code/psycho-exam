import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostView } from "@/components/blog/PostView";
import { getProfile, isConfigured, isVerifiedEditor } from "@/lib/auth";
import { listPublishedPosts, loadPostLive, loadPublishedPost, sidebarPackages } from "@/lib/blog";
import { listPackages } from "@/lib/packages";
import { listPublishedMocks } from "@/lib/wt/mock";

const SITE = "https://kautilyaonline.com";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPublishedPost(slug);
  if (!post) return { robots: { index: false, follow: false } };
  const title = post.metaTitle || `${post.title} | Kautilya Classes`;
  const description = post.metaDescription || post.excerpt || post.content.slice(0, 160);
  return {
    title,
    description,
    keywords: post.keywords ? post.keywords.split(",").map((k) => k.trim()).filter(Boolean) : undefined,
    robots: { index: true, follow: true },
    alternates: { canonical: `${SITE}/blog/${post.slug}` },
    openGraph: {
      type: "article",
      url: `${SITE}/blog/${post.slug}`,
      title,
      description,
      siteName: "Kautilya Classes · Railway Psycho Test Portal",
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      images: [{ url: post.coverImageUrl || "/og.jpg", alt: post.title }],
      locale: "en_IN",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function BlogPostPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { slug } = await params;
  const { preview } = await searchParams;
  // The panel's preview shows a draft to its editor, and to nobody else.
  const post = preview === "1" && (await isVerifiedEditor()) ? await loadPostLive(slug) : await loadPublishedPost(slug);
  if (!post) notFound();

  const [all, posts, profile, mocks] = await Promise.all([
    listPackages(),
    listPublishedPosts(),
    isConfigured() ? getProfile() : Promise.resolve(null),
    isConfigured() ? listPublishedMocks().catch(() => []) : Promise.resolve([]),
  ]);
  const { packages, upsell, saving } = sidebarPackages(post, all);
  const related = posts.filter((p) => p.slug !== post.slug && p.exam === post.exam).slice(0, 3);
  const freeMock = mocks.find((m) => m.isFree) ?? null;

  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.metaDescription || post.excerpt,
      datePublished: post.publishedAt ?? post.createdAt,
      dateModified: post.updatedAt,
      author: { "@type": "Organization", name: post.author },
      publisher: { "@type": "Organization", name: "Kautilya Classes", logo: { "@type": "ImageObject", url: `${SITE}/kautilya-logo.png` } },
      image: post.coverImageUrl || `${SITE}/og.jpg`,
      mainEntityOfPage: `${SITE}/blog/${post.slug}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Articles", item: `${SITE}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: `${SITE}/blog/${post.slug}` },
      ],
    },
  ];
  if (post.faq.length) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: post.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {preview === "1" && !post.isPublished && (
        <p className="bg-amber-400 px-4 py-1.5 text-center text-[12px] font-bold text-amber-950">Draft preview: students cannot see this article until it is published.</p>
      )}
      <PostView post={post} packages={packages} upsell={upsell} saving={saving} related={related} signedIn={Boolean(profile)} freeMock={freeMock ? { name: freeMock.name } : null} />
    </>
  );
}
