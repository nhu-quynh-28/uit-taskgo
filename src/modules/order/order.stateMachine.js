import { ORDER_STATUS, TERMINAL_ORDER_STATUSES } from "../../config/constants.js";
import { invalidStateTransition } from "../../utils/AppError.js";

const TRANSITIONS = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.ACCEPTED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.ACCEPTED]: [
    ORDER_STATUS.ARRIVED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.PENDING_PAYMENT,
  ],
  [ORDER_STATUS.ARRIVED]: [ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.IN_PROGRESS]: [ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PENDING_PAYMENT]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.COMPLETED]: [],
  [ORDER_STATUS.CANCELLED]: [],
};

export function canTransition(from, to) {
  return (TRANSITIONS[from] ?? []).includes(to);
}

export function assertTransition(order, to) {
  if (!canTransition(order.status, to)) {
    throw invalidStateTransition(order.status, to);
  }
}

export function isTerminal(status) {
  return TERMINAL_ORDER_STATUSES.has(status);
}

export { ORDER_STATUS };
