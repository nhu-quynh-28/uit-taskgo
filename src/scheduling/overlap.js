import { ACTIVE_SCHEDULE_STATUSES, SCHEDULE_BUFFER_MINUTES } from "./constants.js";

/**
 * Standard half-open interval overlap: [startA, endA) vs [startB, endB)
 * Uses: existingStart < newEnd && existingEnd > newStart
 */
export function intervalsOverlap(startA, endA, startB, endB) {
  const a0 = toDate(startA);
  const a1 = toDate(endA);
  const b0 = toDate(startB);
  const b1 = toDate(endB);
  if (!a0 || !a1 || !b0 || !b1) return false;
  return a0.getTime() < b1.getTime() && a1.getTime() > b0.getTime();
}

export function addMinutes(date, minutes) {
  const d = toDate(date);
  if (!d) return null;
  return new Date(d.getTime() + minutes * 60_000);
}

function toDate(value) {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Effective reservation window for an order (buffer extends end for availability checks).
 */
export function getOrderScheduleWindow(order, { bufferMinutes = SCHEDULE_BUFFER_MINUTES } = {}) {
  const start = toDate(order.scheduledStartAt ?? order.scheduledAt);
  let end = toDate(order.scheduledEndAt);
  if (!start) return null;
  if (!end || end.getTime() <= start.getTime()) {
    end = addMinutes(start, order.estimatedDurationMinutes ?? 60);
  }
  const bufferedEnd = addMinutes(end, bufferMinutes);
  return { start, end, bufferedEnd };
}

export function isActiveScheduleStatus(status) {
  return ACTIVE_SCHEDULE_STATUSES.includes(status);
}

export function orderOverlapsWindow(order, windowStart, windowEnd, options = {}) {
  if (!isActiveScheduleStatus(order.status)) return false;
  if (options.excludeOrderId && order.id === options.excludeOrderId) return false;
  if (!order.taskerId) return false;

  const slot = getOrderScheduleWindow(order, options);
  if (!slot) return false;

  const compareEnd = options.useBuffer === false ? slot.end : slot.bufferedEnd;
  return intervalsOverlap(slot.start, compareEnd, windowStart, windowEnd);
}

export function findConflictingOrders(orders, taskerId, windowStart, windowEnd, options = {}) {
  return orders.filter(
    (o) =>
      o.taskerId === taskerId &&
      orderOverlapsWindow(o, windowStart, windowEnd, options),
  );
}

export function isTaskerAvailableForWindow(orders, taskerId, windowStart, windowEnd, options = {}) {
  return findConflictingOrders(orders, taskerId, windowStart, windowEnd, options).length === 0;
}

export function buildBookingWindow({ startAt, durationMinutes, bufferMinutes = 0 }) {
  const start = toDate(startAt);
  if (!start) throw new Error("Invalid booking start time");
  const minutes = Number(durationMinutes);
  const duration = Number.isFinite(minutes) && minutes > 0 ? minutes : 60;
  const end = addMinutes(start, duration);
  const endWithBuffer = addMinutes(end, bufferMinutes);
  return { start, end, endWithBuffer, durationMinutes: duration };
}
