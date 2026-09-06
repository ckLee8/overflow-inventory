/**
 * Business calendar timezone for “today” (order grid locks + stock counts).
 *
 * Set via APP_TIMEZONE (IANA name). Defaults to America/New_York.
 * Used on the server for auth of edits; pass todayDate into client UIs so
 * browser locale cannot unlock past/future days.
 */
export const DEFAULT_APP_TIMEZONE = "America/New_York";

export const APP_TIMEZONE =
  (typeof process !== "undefined" && process.env.APP_TIMEZONE?.trim()) ||
  DEFAULT_APP_TIMEZONE;

/** Calendar date YYYY-MM-DD in the business timezone. */
export function todayDateString(
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

export function isTodayDateString(
  date: string,
  timeZone: string = APP_TIMEZONE,
  now: Date = new Date(),
): boolean {
  return date === todayDateString(timeZone, now);
}
