/**
 * Business calendar timezone for “today” (order grid locks + stock counts).
 *
 * Set via APP_TIMEZONE (IANA name). Defaults to America/New_York.
 * Used on the server for auth of edits; pass todayDate into client UIs so
 * browser locale cannot unlock past/future days.
 *
 * Admins can override the effective “today” via Admin → Test clock
 * (`getBusinessClock`) so weekly-grid and on-hand copy can be exercised
 * without waiting for the calendar.
 */
export const DEFAULT_APP_TIMEZONE = "America/New_York";

export const APP_TIMEZONE =
  (typeof process !== "undefined" && process.env.APP_TIMEZONE?.trim()) ||
  DEFAULT_APP_TIMEZONE;

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export function isYmd(value: string): boolean {
  if (!YMD.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/** Wall-clock calendar date YYYY-MM-DD in the business timezone (ignores test clock). */
export function realTodayDateString(
  timeZone: string = APP_TIMEZONE,
  now: Date = new Date(),
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * Calendar date YYYY-MM-DD in the business timezone (wall clock, no test override).
 * Prefer `getBusinessClock()` / `getBusinessToday()` for edit locks and UI copy.
 */
export function todayDateString(
  timeZone: string = APP_TIMEZONE,
  now: Date = new Date(),
): string {
  return realTodayDateString(timeZone, now);
}

export function isTodayDateString(
  date: string,
  timeZone: string = APP_TIMEZONE,
  now: Date = new Date(),
): boolean {
  return date === todayDateString(timeZone, now);
}

/** Monday 00:00 UTC of the week containing `ymd` (week starts Monday). */
export function mondayUtcForDateString(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + mondayOffset);
  return date;
}

export function addUtcDays(start: Date, days: number): Date {
  const d = new Date(start.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function formatYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const SHORT_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function weekdayShortUtc(ymd: string): string {
  return SHORT_WEEKDAYS[new Date(`${ymd}T00:00:00.000Z`).getUTCDay()];
}

export function formatLongDateUtc(ymd: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${ymd}T00:00:00.000Z`));
}
