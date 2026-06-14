import { BOOKING_TYPES } from "./constants.js";
import { resolveServiceDurationMinutes } from "./duration.js";
import { buildBookingWindow } from "./overlap.js";
import { badRequest } from "../utils/AppError.js";

export function resolveCreateOrderSchedule(payload, service) {
  const bookingType = payload.bookingType === BOOKING_TYPES.INSTANT
    ? BOOKING_TYPES.INSTANT
    : BOOKING_TYPES.SCHEDULED;

  const durationMinutes = resolveServiceDurationMinutes(service);

  let startAt;
  if (bookingType === BOOKING_TYPES.INSTANT) {
    startAt = new Date();
  } else {
    startAt = new Date(payload.scheduledAt);
    if (Number.isNaN(startAt.getTime())) {
      throw badRequest("Invalid scheduledAt datetime");
    }
  }

  let window;
  try {
    window = buildBookingWindow({ startAt, durationMinutes });
  } catch {
    throw badRequest("Invalid booking schedule");
  }

  return {
    bookingType,
    serviceId: service?.id ?? payload.serviceId ?? null,
    estimatedDurationMinutes: durationMinutes,
    scheduledAt: window.start,
    scheduledStartAt: window.start,
    scheduledEndAt: window.end,
  };
}
