/**
 * Klausur date utility
 * Shared isFebruary9 check for Europe/Berlin timezone.
 *
 * CHANGE LOG & FEATURES:
 * 1. isFebruary9Berlin
 * - What: Returns true if current date is Feb 9 in Europe/Berlin
 * - Why: Tool availability on exam date; used by middleware, page, toolbox
 */
export function isFebruary9Berlin(): boolean {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return month === "02" && day === "09";
}
