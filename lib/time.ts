/**
 * Pakistan Standard Time helpers.
 *
 * The app serves Pakistan only, but the server runs in UTC. Any date/time typed into a
 * form is a PKT wall-clock time, and anything rendered on the server must be formatted
 * in PKT explicitly — otherwise events drift by five hours.
 */
export const PKT_TIME_ZONE = "Asia/Karachi";
const PKT_OFFSET = "+05:00"; // Pakistan has no daylight saving time

/** Converts a PKT calendar date (YYYY-MM-DD) and time (HH:mm) to a UTC ISO timestamp. */
export function pktDateTimeToIso(date: string, time?: string | null): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(time || "");
  const hh = match ? match[1].padStart(2, "0") : "20";
  const mm = match ? match[2] : "00";
  const parsed = new Date(`${date}T${hh}:${mm}:00${PKT_OFFSET}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/** Formats a timestamp in Pakistan time regardless of where the code is running. */
export function formatPkt(
  value: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }
): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", { ...options, timeZone: PKT_TIME_ZONE });
}
