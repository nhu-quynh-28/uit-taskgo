import type { ApiErrorBody, PaymentFailedData } from "./types";

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;
  readonly data?: unknown;
  readonly requestId?: string;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    options?: { details?: unknown; data?: unknown; requestId?: string },
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = options?.details;
    this.data = options?.data;
    this.requestId = options?.requestId;
  }

  static fromBody(
    statusCode: number,
    body: ApiErrorBody,
    options?: { data?: unknown; requestId?: string },
  ): ApiError {
    return new ApiError(statusCode, body.code, body.message, {
      details: body.details,
      data: options?.data,
      requestId: options?.requestId,
    });
  }
}

/** HTTP 402 — mock PayOS failure (locked contract) */
export class PaymentFailedError extends ApiError {
  readonly paymentData: PaymentFailedData;

  constructor(message: string, paymentData: PaymentFailedData, requestId?: string) {
    super(402, "PAYMENT_FAILED", message, { data: paymentData, requestId });
    this.name = "PaymentFailedError";
    this.paymentData = paymentData;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isPaymentFailedError(error: unknown): error is PaymentFailedError {
  return error instanceof PaymentFailedError;
}

export function isConflictError(error: unknown): boolean {
  return isApiError(error) && error.statusCode === 409;
}

export function isInvalidStateTransitionError(error: unknown): boolean {
  return isApiError(error) && error.code === "INVALID_STATE_TRANSITION";
}
