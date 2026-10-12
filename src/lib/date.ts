/**
 * Local Date & Timezone Utilities
 * Supports custom daily reset times (e.g. 12:00 AM, 3:00 AM, 4:00 AM) in the user's local timezone.
 */

/**
 * Parses a reset time string ("HH:mm" or "H:mm") into hours and minutes.
 * Defaults to 0:00 (12:00 AM midnight).
 */
export function parseResetTime(resetTime?: string | null): { hours: number; minutes: number } {
  if (!resetTime) return { hours: 0, minutes: 0 };
  const match = String(resetTime).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return { hours: 0, minutes: 0 };
  const hours = Math.max(0, Math.min(23, parseInt(match[1], 10)));
  const minutes = Math.max(0, Math.min(59, parseInt(match[2], 10)));
  return { hours, minutes };
}

/**
 * Formats a reset time string ("04:00") into a human-friendly format ("4:00 AM", "12:00 AM").
 */
export function formatResetTimeDisplay(resetTime?: string | null): string {
  const { hours, minutes } = parseResetTime(resetTime);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes > 0 ? `:${String(minutes).padStart(2, "0")}` : ":00";
  return `${displayHours}${displayMinutes} ${period}`;
}

/**
 * Returns a 'YYYY-MM-DD' string for a date in the local timezone (not UTC),
 * taking into account an optional daily reset time (default "00:00" = 12:00 AM).
 * If the current time is before the reset time, it falls under the previous calendar day.
 */
export function getLocalDateString(date: Date = new Date(), resetTime: string = "00:00"): string {
  const { hours, minutes } = parseResetTime(resetTime);
  const shiftMs = (hours * 60 + minutes) * 60 * 1000;
  const effective = new Date(date.getTime() - shiftMs);
  const year = effective.getFullYear();
  const month = String(effective.getMonth() + 1).padStart(2, "0");
  const day = String(effective.getDate()).padStart(2, "0");
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
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
 * Calculates the exact UTC start and end bounds for a given calendar day in the user's timezone,
 * accounting for a custom daily reset time (default "00:00" = 12:00 AM midnight).
 * For a date 'YYYY-MM-DD' with resetTime '04:00', the bounds are:
 * Start: YYYY-MM-DD 04:00:00.000 local
 * End: (YYYY-MM-DD + 1 day) 03:59:59.999 local (24 hours minus 1 ms later)
 */
export function getLocalDayBounds(
  dateStr?: string | null,
  offsetMinutes: number = 0,
  resetTime: string = "00:00"
): { date: string; startOfDay: Date; endOfDay: Date } {
  const { hours: rH, minutes: rM } = parseResetTime(resetTime);
  let y: number;
  let m: number;
  let d: number;

  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const parts = dateStr.split("-").map(Number);
    y = parts[0];
    m = parts[1];
    d = parts[2];
  } else {
    // Current time shifted by timezone offset AND reset time
    const now = new Date();
    const shiftMs = (offsetMinutes + rH * 60 + rM) * 60000;
    const localNow = new Date(now.getTime() - shiftMs);
    y = localNow.getUTCFullYear();
    m = localNow.getUTCMonth() + 1;
    d = localNow.getUTCDate();
  }

  const formattedDate = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const startOfDay = new Date(Date.UTC(y, m - 1, d, rH, rM, 0, 0) + offsetMinutes * 60000);
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

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
