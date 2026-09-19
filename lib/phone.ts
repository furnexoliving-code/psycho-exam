/**
 * Mobile numbers as the login identity.
 *
 * Supabase Auth is built around an email address. Its phone sign-in needs an
 * SMS provider — a cost per message, and an OTP round trip on every login,
 * which is the opposite of fast. So each mobile number is mapped to an
 * internal address in a domain that receives no mail: the student types a
 * mobile number and a password, and nothing is ever sent anywhere.
 */
const DOMAIN = "students.kautilya.local";

/**
 * Strips a typed number down to its ten digits.
 *
 * People write the same number many ways — +91, a leading 0, spaces, dashes.
 * All of them must reach the same account, or a student will be locked out of
 * an account they can see was created for them.
 */
export function normalisePhone(raw: string): string {
  const digits = String(raw ?? "").replace(/\D/g, "");

  // Drop an Indian country code or a trunk prefix, whichever was typed.
  const local = digits.startsWith("91") && digits.length === 12
    ? digits.slice(2)
    : digits.startsWith("0") && digits.length === 11
      ? digits.slice(1)
      : digits;

  return local;
}

/** True for something that can actually be an Indian mobile number. */
export function isValidPhone(raw: string): boolean {
  const local = normalisePhone(raw);
  return /^[6-9]\d{9}$/.test(local);
}

/** The internal address a mobile number signs in with. */
export function phoneToEmail(raw: string): string {
  return `${normalisePhone(raw)}@${DOMAIN}`;
}

/** The mobile number behind an internal address, for showing it back. */
export function emailToPhone(email: string): string {
  return email.endsWith(`@${DOMAIN}`) ? email.slice(0, -(DOMAIN.length + 1)) : email;
}
