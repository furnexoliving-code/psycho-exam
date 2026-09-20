import { AdminSetupGuide } from "@/components/AdminSetupGuide";
import { SiteHeader } from "@/components/SiteHeader";
import { SignOutButton } from "@/components/SignOutButton";
import { isConfigured, missingConfig, requireStaff } from "@/lib/auth";

/**
 * The staff area: one page, one job. Behind the same two locks as the admin
 * panel — the role and the second factor — checked here and again in the
 * page and the action, since a layout alone can be skipped.
 */
export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  if (!isConfigured()) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <SiteHeader />
        <AdminSetupGuide missing={missingConfig()} />
      </div>
    );
  }

  const profile = await requireStaff();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader
        right={
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-white/80">{profile.full_name || "Staff"}</span>
            <SignOutButton />
          </div>
        }
      />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-6">{children}</main>
    </div>
  );
}
