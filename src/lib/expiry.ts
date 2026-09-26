/** Expiry helpers for My Pantry (design document UC3). */

export type ExpiryStatus = "expired" | "today" | "soon" | "fresh" | "none";

/** Items expiring within this many days are highlighted. */
export const EXPIRING_SOON_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Whole days from today until the expiry date (negative = expired). */
export function daysUntil(expiry: Date, now: Date = new Date()): number {
  return Math.round((startOfDay(expiry) - startOfDay(now)) / DAY_MS);
}

export function expiryStatus(expiry: Date | null | undefined, now: Date = new Date()): ExpiryStatus {
  if (!expiry) return "none";
  const d = daysUntil(expiry, now);
  if (d < 0) return "expired";
  if (d === 0) return "today";
  if (d <= EXPIRING_SOON_DAYS) return "soon";
  return "fresh";
}

export function isExpiringSoon(expiry: Date | null | undefined, now: Date = new Date()): boolean {
  const s = expiryStatus(expiry, now);
  return s === "today" || s === "soon";
}

/** Short human label, e.g. "Expires tomorrow", "Expired 2 days ago". */
export function expiryLabel(expiry: Date | null | undefined, now: Date = new Date()): string {
  if (!expiry) return "No expiry date";
  const d = daysUntil(expiry, now);
  if (d < -1) return `Expired ${-d} days ago`;
  if (d === -1) return "Expired yesterday";
  if (d === 0) return "Expires today";
  if (d === 1) return "Expires tomorrow";
  return `Expires in ${d} days`;
}

/** Parse a yyyy-mm-dd string from a date input as a local date. */
export function parseDateInput(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Format a Date for a date input (yyyy-mm-dd, local time). */
export function toDateInput(d: Date | null | undefined): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
