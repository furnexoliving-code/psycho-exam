import Link from "next/link";
import { AdminSetupGuide } from "@/components/AdminSetupGuide";
import { SiteHeader } from "@/components/SiteHeader";
import { SignOutButton } from "@/components/SignOutButton";
import { isConfigured, mayOpen, missingConfig, requirePanel, type Section } from "@/lib/auth";

/** Every tab, with the section it belongs to; an account sees only its own. */
const NAV: { href: string; label: string; section: Section }[] = [
  { href: "/admin", label: "Overview", section: "admin" },
  { href: "/admin/watch-table", label: "Following Directions Test", section: "papers" },
  { href: "/admin/students", label: "Students & Results", section: "admin" },
  { href: "/admin/passwords", label: "Reset a password", section: "passwords" },
];

const ROLE_LABEL = { admin: "Admin", editor: "Test setter", staff: "Staff", student: "" };

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

  // Checked here on the server for every panel page, not just in middleware:
  // a panel role and the second factor. Which SECTION the account may open
  // is checked again by each page, since a request can skip the layout.
  const profile = await requirePanel();
  const tabs = NAV.filter((item) => mayOpen(profile.role, item.section));

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader
        right={
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-white/80">
              {profile.full_name || ROLE_LABEL[profile.role]}
              {profile.role !== "admin" && (
                <span className="ml-1 rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold">
                  {ROLE_LABEL[profile.role]}
                </span>
              )}
            </span>
            <SignOutButton />
          </div>
        }
      />

      <nav className="flex gap-1 border-b border-gray-300 bg-white px-4">
        {tabs.map((item) => (
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
