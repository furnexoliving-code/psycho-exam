import { AdminSetupGuide } from "@/components/AdminSetupGuide";
import { SiteHeader } from "@/components/SiteHeader";
import { SignOutButton } from "@/components/SignOutButton";
import { isConfigured, missingConfig, requirePanelRole } from "@/lib/auth";

/**
 * The two pages that stand between the admin's password and the panel:
 * setting up the authenticator, and entering its code. They need the admin
 * ROLE (admin or staff) but not the second factor — that is what they exist to establish —
 * so they live outside the panel's own layout, which demands both.
 */
export default async function GateLayout({ children }: { children: React.ReactNode }) {
  if (!isConfigured()) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <SiteHeader />
        <AdminSetupGuide missing={missingConfig()} />
      </div>
    );
  }

  const profile = await requirePanelRole();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader
        right={
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-white/80">{profile.full_name || "Admin"}</span>
            <SignOutButton />
          </div>
        }
      />
      <main className="mx-auto w-full max-w-md flex-1 px-5 py-10">{children}</main>
    </div>
  );
}
