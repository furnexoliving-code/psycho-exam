import { AdminSetupGuide } from "@/components/AdminSetupGuide";
import { SiteHeader } from "@/components/SiteHeader";
import { AdminShell } from "@/components/admin/AdminShell";
import type { NavGroup } from "@/components/admin/AdminNav";
import { isConfigured, mayOpen, missingConfig, requirePanel, type Section } from "@/lib/auth";

/**
 * The admin's heavy work (an import of thousands, a package given to every
 * student, a paper regenerated) may run up to forty seconds before the
 * platform cuts it off; the default is fifteen. A ceiling, not a cost: a
 * request pays only for the time it actually runs.
 */
export const maxDuration = 40;

/** Every page, grouped by what it is about, with the section it belongs to; an account sees only its own. */
const NAV: { title: string; items: { href: string; label: string; icon: string; section: Section }[] }[] = [
  { title: "Overview", items: [{ href: "/admin", label: "Home", icon: "🏠", section: "admin" }] },
  {
    title: "Students",
    items: [
      { href: "/admin/students", label: "Students", icon: "🎓", section: "admin" },
      { href: "/admin/packages", label: "Packages", icon: "🎟️", section: "admin" },
      { href: "/admin/coupons", label: "Coupons", icon: "🏷️", section: "admin" },
      { href: "/admin/orders", label: "Orders & payments", icon: "₹", section: "admin" },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/papers", label: "Test Papers", icon: "📝", section: "papers" },
      { href: "/admin/mocks", label: "Full Mocks", icon: "🏁", section: "papers" },
      { href: "/admin/reports", label: "Question reports", icon: "🚩", section: "papers" },
      { href: "/admin/blog", label: "Blog", icon: "✍️", section: "admin" },
    ],
  },
  { title: "Results", items: [{ href: "/admin/results", label: "Results", icon: "📊", section: "results" }, { href: "/admin/analytics", label: "Analytics", icon: "📈", section: "results" }] },
  {
    title: "Settings",
    items: [
      { href: "/admin/team", label: "Settings & team", icon: "⚙️", section: "admin" },
      { href: "/admin/passwords", label: "Reset a password", icon: "🔑", section: "passwords" },
    ],
  },
];

const ROLE_LABEL = { admin: "Admin", editor: "Test setter", staff: "Staff", viewer: "Result viewer", student: "" };

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
  const groups: NavGroup[] = NAV.map((g) => ({ title: g.title, items: g.items.filter((item) => mayOpen(profile.role, item.section)) })).filter((g) => g.items.length > 0);

  return (
    <AdminShell profile={{ name: profile.full_name || ROLE_LABEL[profile.role], role: ROLE_LABEL[profile.role] }} groups={groups} canSearch={mayOpen(profile.role, "admin")}>
      {children}
    </AdminShell>
  );
}
