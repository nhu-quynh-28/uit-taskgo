export const ROLES = Object.freeze(["admin", "customer", "tasker"]);

export const ORDER_STATUS = Object.freeze({
  PENDING: "pending",
  ACCEPTED: "accepted",
  ARRIVED: "arrived",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  PENDING_PAYMENT: "pending_payment",
});

export const PAYMENT_STATUS = Object.freeze({
  UNPAID: "unpaid",
  PROCESSING: "processing",
  PAID: "paid",
  FAILED: "failed",
});

export const TERMINAL_ORDER_STATUSES = new Set([
  ORDER_STATUS.COMPLETED,
  ORDER_STATUS.CANCELLED,
]);

export const ACCOUNT_STATUS = Object.freeze({
  ACTIVE: "active",
  BLOCKED: "blocked",
});

export const VERIFICATION_STATUS = Object.freeze({
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
});

/** Stored values align with admin UI (open / in-progress / resolved / escalated). */
export const COMPLAINT_STATUS = Object.freeze({
  OPEN: "open",
  IN_PROGRESS: "in-progress",
  RESOLVED: "resolved",
  ESCALATED: "escalated",
});

export const COMPLAINT_PRIORITY = Object.freeze({
  URGENT: "urgent",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
});
