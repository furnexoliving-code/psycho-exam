"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/**
 * The panel's menu, grouped by what the work is about, with the page the
 * admin is on marked. Drawn in the sidebar on a wide screen and inside
 * the menu button on a narrow one.
 */
export function AdminNav({ groups, onPick }: { groups: NavGroup[]; onPick?: () => void }) {
  const pathname = usePathname() ?? "";
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));
  return (
    <nav aria-label="Admin" className="space-y-4">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">{g.title}</p>
          <ul className="mt-1 space-y-0.5">
            {g.items.map((item) => {
              const on = active(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onPick}
                    aria-current={on ? "page" : undefined}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition ${
                      on ? "bg-[#0d2a6b] text-white shadow-sm" : "text-gray-700 hover:bg-[#eef2fb] hover:text-[#0d2a6b]"
                    }`}
                  >
                    <span className="w-5 text-center text-[15px]" aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
