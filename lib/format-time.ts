/**
 * Dates and times, always in India's time zone.
 *
 * The pages render on a server that keeps UTC, so a plain toLocaleString
 * there showed every submission five and a half hours early. The institute
 * and its students are in India; the zone is fixed rather than taken from
 * the machine, so the server, the admin's laptop and a student's phone all
 * print the same clock.
 */
const ZONE = "Asia/Kolkata";

/** 21/09/2026, 2:03 pm */
export function formatDateTime(when: string | number | Date): string {
  return new Date(when).toLocaleString("en-IN", {
    timeZone: ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** 21 Sep 2026 */
export function formatDate(when: string | number | Date): string {
  return new Date(when).toLocaleDateString("en-IN", {
    timeZone: ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** 21 Sep */
export function formatDayMonth(when: string | number | Date): string {
  return new Date(when).toLocaleDateString("en-IN", {
    timeZone: ZONE,
    day: "numeric",
    month: "short",
  });
}

/** The calendar day in India, as YYYY-MM-DD, for comparing with a date input. */
export function indianDay(when: string | number | Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(when));
  return parts;
}

/** The moment as a datetime-local input wants it, in India: YYYY-MM-DDTHH:mm. */
export function indianLocalInput(when: string | number | Date | null | undefined): string {
  if (!when) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(when));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour") === "24" ? "00" : get("hour")}:${get("minute")}`;
}

/** A datetime-local value typed in India, as an instant; null when blank. */
export function fromIndianLocalInput(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) throw new Error("Not a date and time");
  return new Date(`${v.slice(0, 16)}:00+05:30`).toISOString();
}
