import type { Metadata } from "next";
import { PublicFooter, PublicHeader } from "@/components/landing/LandingPage";
import { StudentHeader } from "@/components/StudentHeader";
import { getProfile, isConfigured } from "@/lib/auth";
import { photoUrlOf } from "@/lib/photo";
import { accessFor, enrollmentActive, listPackages } from "@/lib/packages";
import { PackagesView } from "@/components/student/PackagesView";
import { razorpayConfigured } from "@/lib/razorpay";
import { couponProblem, discounted, loadCoupon, normaliseCode } from "@/lib/coupons";
import { listPublishedMocks } from "@/lib/wt/mock";

export const metadata: Metadata = {
  title: "RRB ALP Psycho Test Series Packages & Prices | Kautilya Classes",
  description: "Buy the RRB ALP psycho test (CBAT) test series: Sectional tests, Full Mock Tests or both. One free Full Mock for every account. As per RDSO pattern, Hindi + English.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://kautilyaonline.com/packages" },
};


/**
 * The packages on sale and the free mock. Open to everyone: a visitor
 * sees prices and a sign-up button; a signed-in student sees Buy, or
 * "Active" on what they already hold.
 */
export default async function PackagesPage({ searchParams }: { searchParams: Promise<{ paid?: string; coupon?: string }> }) {
  const { paid, coupon: couponRaw } = await searchParams;
  const profile = isConfigured() ? await getProfile() : null;
  const [packages, mocks, access] = await Promise.all([
    listPackages("alp"),
    isConfigured() ? listPublishedMocks().catch(() => []) : Promise.resolve([]),
    profile ? accessFor(profile.id, profile.role) : Promise.resolve(null),
  ]);
  const freeMock = mocks.find((m) => m.isFree) ?? null;
  const online = razorpayConfigured();
  const held = new Map((access?.enrollments ?? []).filter(enrollmentActive).map((e) => [e.package.id, e]));

  // A code typed on the page: the price it gives each package, or why not.
  let coupon: { code: string; message: string | null; prices: Map<string, { price: number; discount: number }> } | null = null;
  if (couponRaw && normaliseCode(couponRaw)) {
    const code = normaliseCode(couponRaw);
    const found = await loadCoupon(code);
    const prices = new Map<string, { price: number; discount: number }>();
    let message: string | null = found ? couponProblem(found) : "No such code.";
    if (found && !message) {
      for (const p of packages) if (!couponProblem(found, p)) prices.set(p.id, discounted(found, p.priceInr));
      if (prices.size === 0) message = `This code works only on ${found.packageSlug?.replace(/-/g, " ") ?? "another package"}.`;
    }
    coupon = { code, message, prices };
  }

  const view = (
    <PackagesView
      profile={profile ? { full_name: profile.full_name } : null}
      packages={packages}
      freeMock={freeMock ? { name: freeMock.name, slug: freeMock.slug } : null}
      online={online}
      held={held}
      paid={Boolean(paid)}
      coupon={coupon}
    />
  );

  if (profile) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f4f6fb]">
        <StudentHeader name={profile.full_name || "Candidate"} active="packages" photoUrl={photoUrlOf(profile)} />
        {view}
      </div>
    );
  }
  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6fb]">
      <PublicHeader />
      {view}
      <PublicFooter />
    </div>
  );
}
