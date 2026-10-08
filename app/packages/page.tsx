import type { Metadata } from "next";
import { PublicFooter, PublicHeader } from "@/components/landing/LandingPage";
import { StudentHeader } from "@/components/StudentHeader";
import { getProfile, isConfigured } from "@/lib/auth";
import { photoUrlOf } from "@/lib/photo";
import { accessFor, enrollmentActive, listPackages } from "@/lib/packages";
import { PackagesView } from "@/components/student/PackagesView";
import { razorpayConfigured } from "@/lib/razorpay";
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
export default async function PackagesPage({ searchParams }: { searchParams: Promise<{ paid?: string }> }) {
  const { paid } = await searchParams;
  const profile = isConfigured() ? await getProfile() : null;
  const [packages, mocks, access] = await Promise.all([
    listPackages("alp"),
    isConfigured() ? listPublishedMocks().catch(() => []) : Promise.resolve([]),
    profile ? accessFor(profile.id, profile.role) : Promise.resolve(null),
  ]);
  const freeMock = mocks.find((m) => m.isFree) ?? null;
  const online = razorpayConfigured();
  const held = new Map((access?.enrollments ?? []).filter(enrollmentActive).map((e) => [e.package.id, e]));

  const view = (
    <PackagesView
      profile={profile ? { full_name: profile.full_name } : null}
      packages={packages}
      freeMock={freeMock ? { name: freeMock.name, slug: freeMock.slug } : null}
      online={online}
      held={held}
      paid={Boolean(paid)}
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
