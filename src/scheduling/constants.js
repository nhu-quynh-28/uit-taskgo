import { ORDER_STATUS } from "../config/constants.js";

/** Statuses that reserve a tasker on the calendar (pending pool does not). */
export const ACTIVE_SCHEDULE_STATUSES = Object.freeze([
  ORDER_STATUS.ACCEPTED,
  ORDER_STATUS.ARRIVED,
  ORDER_STATUS.IN_PROGRESS,
]);

export const DEFAULT_SERVICE_DURATION_MINUTES = 60;

/** Optional gap after a job before the tasker can take another booking. */
export const SCHEDULE_BUFFER_MINUTES = 15;

export const BOOKING_TYPES = Object.freeze({
  INSTANT: "instant",
  SCHEDULED: "scheduled",
});
