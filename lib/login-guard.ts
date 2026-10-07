import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Wrong passwords are counted per mobile number; the fifth in a row locks
 * the number for ten minutes. A guess-the-password run thus gets five
 * tries per ten minutes instead of thousands. A database without the
 * table lets everyone through: a missing guard must not lock the door.
 */
export const MAX_FAILURES = 5;
export const LOCK_MINUTES = 10;

export const DEVICE_COOKIE = "kc_device";

/** Seconds the number is still locked for; 0 when it may try. */
export async function lockedFor(phone: string): Promise<number> {
  try {
    const { data } = await createAdminClient().from("login_locks").select("locked_until").eq("phone", phone).maybeSingle();
    const until = data?.locked_until ? new Date(data.locked_until as string).getTime() : 0;
    return Math.max(0, Math.ceil((until - Date.now()) / 1000));
  } catch {
    return 0;
  }
}

/** One more wrong password; returns how many tries are left before the lock. */
export async function noteFailure(phone: string): Promise<number> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("login_locks").select("failures, locked_until").eq("phone", phone).maybeSingle();
    const lockedBefore = data?.locked_until && new Date(data.locked_until as string).getTime() > Date.now();
    const failures = lockedBefore ? 1 : (Number(data?.failures ?? 0) || 0) + 1;
    const lock = failures >= MAX_FAILURES;
    await supabase.from("login_locks").upsert({
      phone,
      failures: lock ? 0 : failures,
      locked_until: lock ? new Date(Date.now() + LOCK_MINUTES * 60000).toISOString() : null,
      updated_at: new Date().toISOString(),
    });
    return lock ? 0 : MAX_FAILURES - failures;
  } catch {
    return MAX_FAILURES;
  }
}

/** A right password clears the count. */
export async function clearFailures(phone: string): Promise<void> {
  try {
    await createAdminClient().from("login_locks").delete().eq("phone", phone);
  } catch {
    // Nothing to clear, or no table yet.
  }
}
