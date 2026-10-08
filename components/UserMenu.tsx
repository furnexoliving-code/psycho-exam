"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { clearAttemptStorage } from "@/lib/wt/state";

/**
 * The signed-in student's corner of the masthead: their photo and name,
 * and under it the things that are theirs to do: profile, photo, name,
 * password, sign out.
 */
export function UserMenu({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const initial = (name.trim()[0] ?? "S").toUpperCase();

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const signOut = async () => {
    clearAttemptStorage();
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const item = "flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-gray-800 hover:bg-gray-50";

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full py-0.5 pl-0.5 pr-2 hover:bg-gray-100"
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="h-8 w-8 rounded-full border border-gray-300 object-cover" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#1d4ed8] to-[#0d2a6b] text-[12px] font-bold text-white" aria-hidden="true">
            {initial}
          </span>
        )}
        <span className="hidden max-w-[160px] truncate text-[13px] font-semibold text-gray-900 sm:block">{name}</span>
        <span className="text-[10px] text-gray-500" aria-hidden="true">▼</span>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-1.5 w-[230px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
          <div className="border-b border-gray-100 px-3.5 py-2">
            <div className="truncate text-[13px] font-bold text-gray-900">{name}</div>
            <div className="text-[11px] text-gray-500">Student · KAUTILYA CLASSES</div>
          </div>
          <Link href="/profile" role="menuitem" className={item} onClick={() => setOpen(false)}>
            <span aria-hidden="true">👤</span> My profile <span className="text-gray-400" lang="hi">/ प्रोफ़ाइल</span>
          </Link>
          <Link href="/profile#photo" role="menuitem" className={item} onClick={() => setOpen(false)}>
            <span aria-hidden="true">📷</span> Change photo <span className="text-gray-400" lang="hi">/ फ़ोटो</span>
          </Link>
          <Link href="/profile#name" role="menuitem" className={item} onClick={() => setOpen(false)}>
            <span aria-hidden="true">✏️</span> Change name <span className="text-gray-400" lang="hi">/ नाम</span>
          </Link>
          <Link href="/profile#password" role="menuitem" className={item} onClick={() => setOpen(false)}>
            <span aria-hidden="true">🔑</span> Change password <span className="text-gray-400" lang="hi">/ पासवर्ड</span>
          </Link>
          <Link href="/profile#packages" role="menuitem" className={item} onClick={() => setOpen(false)}>
            <span aria-hidden="true">🎫</span> My packages <span className="text-gray-400" lang="hi">/ पैकेज</span>
          </Link>
          <button type="button" role="menuitem" onClick={signOut} className={`${item} w-full border-t border-gray-100 text-red-700 hover:bg-red-50`}>
            <span aria-hidden="true">⏻</span> Sign out <span className="text-red-400" lang="hi">/ लॉग आउट</span>
          </button>
        </div>
      )}
    </div>
  );
}
