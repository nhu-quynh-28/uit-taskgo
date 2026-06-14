export class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR", details = null, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    this.name = "AppError";
  }
}

export function badRequest(message, details, code = "BAD_REQUEST") {
  return new AppError(message, 400, code, details);
}

export function unauthorized(message = "Unauthorized") {
  return new AppError(message, 401, "UNAUTHORIZED");
}

export function forbidden(message = "Forbidden") {
  return new AppError(message, 403, "FORBIDDEN");
}

export function notFound(message = "Resource not found") {
  return new AppError(message, 404, "NOT_FOUND");
}

export function conflict(message = "Conflict", details = null) {
  return new AppError(message, 409, "CONFLICT", details);
}

export function paymentFailed(message, details) {
  return new AppError(message, 402, "PAYMENT_FAILED", details);
}

export function idempotencyKeyReused(message = "Idempotency key reused with different payload") {
  return new AppError(message, 422, "IDEMPOTENCY_KEY_REUSED");
}

export function invalidStateTransition(from, to) {
  return new AppError("Invalid state transition", 400, "INVALID_STATE_TRANSITION", { from, to });
}

export function scheduleConflict(message = "Tasker is not available at this time", details = null) {
  return new AppError(message, 409, "SCHEDULE_CONFLICT", details);
}
