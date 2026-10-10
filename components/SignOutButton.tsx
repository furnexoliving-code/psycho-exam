"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { clearAttemptStorage } from "@/lib/wt/state";

/** `dark` for a dark bar (white outline), `light` for a white one (grey outline, dark ink). */
export function SignOutButton({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        // Whatever this browser kept of a paper leaves with the account.
        clearAttemptStorage();
        await createClient().auth.signOut();
        router.push("/login");
        router.refresh();
      }}
      className={
        tone === "light"
          ? "rounded-md border border-gray-300 px-3 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-50"
          : "rounded border border-white/40 px-3 py-1 text-[12px] font-semibold text-white hover:bg-white/10"
      }
    >
      Sign out
    </button>
  );
}
