import { addDays, format, startOfDay } from "date-fns";

export const MINUTE_OPTIONS = [0, 15, 30, 45] as const;

/** Build a Date in the device's local timezone (avoids UTC date-only parsing bugs). */
export function localDateFromParts(
  dateIso: string,
  hour: number,
  minute: number,
): Date {
  const [y, m, d] = dateIso.split("-").map((x) => parseInt(x, 10));
  return new Date(y, m - 1, d, hour, minute, 0, 0);
}

export function formatLocalDateIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatTimeSlot(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function parseTimeSlot(time: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

/** Round up to the next 15-minute slot in local time. May roll to the next day. */
export function roundToNextQuarterHour(from: Date = new Date()): {
  dateIso: string;
  hour: number;
  minute: number;
} {
  const totalMinutes = from.getHours() * 60 + from.getMinutes();
  let rounded = Math.ceil(totalMinutes / 15) * 15;
  let base = startOfDay(from);

  if (rounded >= 24 * 60) {
    base = addDays(base, 1);
    rounded = 0;
  }

  return {
    dateIso: formatLocalDateIso(base),
    hour: Math.floor(rounded / 60),
    minute: rounded % 60,
  };
}

export function getDefaultScheduledSlot(
  existingDateIso?: string,
  existingTime?: string,
): { dateIso: string; hour: number; minute: number } {
  if (existingDateIso && existingTime) {
    const parsed = parseTimeSlot(existingTime);
    if (parsed) {
      return { dateIso: existingDateIso, hour: parsed.hour, minute: parsed.minute };
    }
  }
  return roundToNextQuarterHour(new Date());
}

export function isDateBeforeToday(dateIso: string): boolean {
  const today = formatLocalDateIso(new Date());
  return dateIso < today;
}

export function getAvailableHours(dateIso: string): number[] {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const todayIso = formatLocalDateIso(new Date());
  if (dateIso !== todayIso) return hours;
  const nowHour = new Date().getHours();
  return hours.filter((h) => h >= nowHour);
}

export function getAvailableMinutes(dateIso: string, hour: number): number[] {
  const todayIso = formatLocalDateIso(new Date());
  if (dateIso !== todayIso) return [...MINUTE_OPTIONS];

  const now = new Date();
  if (hour > now.getHours()) return [...MINUTE_OPTIONS];
  if (hour < now.getHours()) return [];

  const minAllowed = Math.ceil(now.getMinutes() / 15) * 15;
  return MINUTE_OPTIONS.filter((m) => m >= minAllowed);
}

export function validateScheduledSlot(
  dateIso: string,
  hour: number,
  minute: number,
): string | null {
  if (!dateIso || !/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) {
    return "Please select a date";
  }
  if (isDateBeforeToday(dateIso)) {
    return "Past dates are not available";
  }
  if (!MINUTE_OPTIONS.includes(minute as (typeof MINUTE_OPTIONS)[number])) {
    return "Please select a valid time";
  }
  if (hour < 0 || hour > 23) {
    return "Please select a valid hour";
  }

  const slot = localDateFromParts(dateIso, hour, minute);
  if (slot.getTime() < Date.now() - 30_000) {
    return "Please choose a time in the future";
  }

  const allowedMinutes = getAvailableMinutes(dateIso, hour);
  if (!allowedMinutes.includes(minute)) {
    return "This time has already passed today";
  }

  return null;
}

export function formatDisplayDate(dateIso: string): string {
  const [y, m, d] = dateIso.split("-").map((x) => parseInt(x, 10));
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
