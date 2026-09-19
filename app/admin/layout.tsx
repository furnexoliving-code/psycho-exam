import Link from "next/link";
import { AdminSetupGuide } from "@/components/AdminSetupGuide";
import { SiteHeader } from "@/components/SiteHeader";
import { SignOutButton } from "@/components/SignOutButton";
import { isConfigured, missingConfig, requireAdmin } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/watch-table", label: "Following Directions Test" },
  { href: "/admin/students", label: "Students & Results" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Say plainly that the database is missing rather than bouncing to a login
  // page that cannot work yet.
  if (!isConfigured()) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <SiteHeader />
        <AdminSetupGuide missing={missingConfig()} />
      </div>
    );
  }

  // Checked here on the server for every admin page, not just in middleware.
  const profile = await requireAdmin();

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

      <nav className="flex gap-1 border-b border-gray-300 bg-white px-4">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="border-b-2 border-transparent px-4 py-2.5 text-[13px] font-semibold
                       text-gray-600 hover:border-rrb-banner hover:text-rrb-banner"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-6">{children}</main>
    </div>
  );
}
