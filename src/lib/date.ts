/**
 * Local Date & Timezone Utilities
 * Ensures daily resets occur precisely at 12:00 AM (midnight) in the user's local timezone.
 */

/**
 * Returns a 'YYYY-MM-DD' string for a date in the local timezone (not UTC).
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Safely adds or subtracts calendar days from a 'YYYY-MM-DD' date string.
 */
export function addDaysToDateString(dateStr: string, days: number): string {
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return getLocalDateString();
  }
  const [y, m, d] = parts;
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return getLocalDateString(date);
}

/**
 * Parses client timezone offset in minutes.
 * - Positive for locations behind UTC (e.g. 420 for PDT, UTC-7).
 * - Negative for locations ahead of UTC (e.g. -540 for JST, UTC+9).
 * - Zero for UTC / GMT.
 */
export function parseOffsetMinutes(
  offsetParam?: string | number | null,
  timezone?: string | null
): number {
  if (offsetParam !== undefined && offsetParam !== null && offsetParam !== "") {
    const parsed = Number(offsetParam);
    if (!Number.isNaN(parsed)) return parsed;
  }

  if (timezone) {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        timeZoneName: "shortOffset",
      });
      const parts = formatter.formatToParts(new Date());
      const tzPart = parts.find((p) => p.type === "timeZoneName")?.value || "";
      const match = tzPart.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
      if (match) {
        const sign = match[1] === "-" ? 1 : -1;
        const hours = parseInt(match[2], 10);
        const minutes = match[3] ? parseInt(match[3], 10) : 0;
        return sign * (hours * 60 + minutes);
      }
    } catch {
      // Fallback to UTC if timezone invalid
    }
  }

  return 0;
}

/**
 * Calculates the exact UTC start (12:00:00.000 AM local) and end (11:59:59.999 PM local)
 * bounds for a given calendar day in the user's timezone.
 */
export function getLocalDayBounds(
  dateStr?: string | null,
  offsetMinutes: number = 0
): { date: string; startOfDay: Date; endOfDay: Date } {
  let y: number;
  let m: number;
  let d: number;

  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const parts = dateStr.split("-").map(Number);
    y = parts[0];
    m = parts[1];
    d = parts[2];
  } else {
    // Current time shifted by offset into local time
    const now = new Date();
    const localNow = new Date(now.getTime() - offsetMinutes * 60000);
    y = localNow.getUTCFullYear();
    m = localNow.getUTCMonth() + 1;
    d = localNow.getUTCDate();
  }

  const formattedDate = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const startOfDay = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0) + offsetMinutes * 60000);
  const endOfDay = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999) + offsetMinutes * 60000);

  return {
    date: formattedDate,
    startOfDay,
    endOfDay,
  };
}

/**
 * Formats a 'YYYY-MM-DD' date string into a user-friendly label.
 * e.g. "Today • Sun, Oct 11", "Yesterday • Sat, Oct 10", or "Sat, Oct 10, 2026"
 */
export function formatDisplayDate(dateStr: string, todayStr?: string): string {
  const effectiveToday = todayStr || getLocalDateString();
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return dateStr;
  }

  const [y, m, d] = parts;
  const dateObj = new Date(y, m - 1, d);
  const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });
  const month = dateObj.toLocaleDateString("en-US", { month: "short" });
  const dayNum = dateObj.getDate();

  if (dateStr === effectiveToday) {
    return `Today • ${weekday}, ${month} ${dayNum}`;
  }

  const yesterdayStr = addDaysToDateString(effectiveToday, -1);
  if (dateStr === yesterdayStr) {
    return `Yesterday • ${weekday}, ${month} ${dayNum}`;
  }

  const tomorrowStr = addDaysToDateString(effectiveToday, 1);
  if (dateStr === tomorrowStr) {
    return `Tomorrow • ${weekday}, ${month} ${dayNum}`;
  }

  return `${weekday}, ${month} ${dayNum}, ${y}`;
}
