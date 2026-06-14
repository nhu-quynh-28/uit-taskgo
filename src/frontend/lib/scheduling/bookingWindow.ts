import { buildScheduledAtIso } from "@/lib/adapters/orderAdapter";
import { formatLocalDateIso } from "@/lib/scheduling/localDateTime";

export type BookingWindowInput = {
  bookingType?: "instant" | "scheduled";
  scheduledDateIso?: string;
  time?: string;
  durationMinutes: number;
};

export type BookingWindow = {
  start: Date;
  end: Date;
  startIso: string;
  endIso: string;
};

const DEFAULT_DURATION_MINUTES = 60;

export function resolveServiceDurationMinutes(service?: {
  estimatedDurationMinutes?: number | null;
  duration?: string;
}): number {
  const explicit = Number(service?.estimatedDurationMinutes);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const label = service?.duration ?? "";
  const range = label.match(/(\d+)\s*-\s*(\d+)\s*h/i);
  if (range) return Math.max(Number(range[1]), Number(range[2])) * 60;
  const hours = label.match(/(\d+(?:\.\d+)?)\s*h/i);
  if (hours) return Math.round(Number(hours[1]) * 60);
  const mins = label.match(/(\d+)\s*m/i);
  if (mins) return Number(mins[1]);
  return DEFAULT_DURATION_MINUTES;
}

export function buildBookingWindow(input: BookingWindowInput): BookingWindow {
  const durationMinutes = Math.max(
    1,
    Number.isFinite(input.durationMinutes) ? input.durationMinutes : DEFAULT_DURATION_MINUTES,
  );

  let start: Date;
  if (input.bookingType === "instant") {
    start = new Date();
  } else {
    const dateIso = input.scheduledDateIso ?? formatLocalDateIso(new Date());
    const time = input.time ?? "09:00";
    start = new Date(buildScheduledAtIso(dateIso, time));
  }

  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return {
    start,
    end,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}
