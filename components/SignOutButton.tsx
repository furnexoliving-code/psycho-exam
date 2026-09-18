"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await createClient().auth.signOut();
        router.push("/login");
        router.refresh();
      }}
      className="rounded border border-white/40 px-3 py-1 text-[12px] font-semibold
                 text-white hover:bg-white/10"
    >
      Sign out
    </button>
  );
}
