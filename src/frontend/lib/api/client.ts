import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { config } from "../config";
import { createRequestId } from "../idempotency";
import { getAccessToken } from "../storage/token";
import { ApiError, PaymentFailedError } from "./errors";
import type { ApiEnvelope, PaymentFailedData } from "./types";

export type UnauthorizedHandler = () => void | Promise<void>;

let unauthorizedHandler: UnauthorizedHandler | null = null;

/** Phase 2: register logout + navigate to login */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

export type ApiRequestConfig = AxiosRequestConfig & {
  /** Do not attach Bearer token (login/register) */
  skipAuth?: boolean;
};

type InternalApiConfig = InternalAxiosRequestConfig & { skipAuth?: boolean };

const axiosInstance: AxiosInstance = axios.create({
  baseURL: config.apiUrl,
  timeout: 30_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(async (req: InternalApiConfig) => {
  req.headers.set("X-Request-Id", createRequestId());

  if (!req.skipAuth) {
    const token = await getAccessToken();
    if (token) {
      req.headers.set("Authorization", `Bearer ${token}`);
    }
  }

  return req;
});

axiosInstance.interceptors.response.use(
  (response) => {
    const body = response.data as ApiEnvelope<unknown> | undefined;

    if (body && typeof body === "object" && "success" in body && body.success === false) {
      throw ApiError.fromBody(
        response.status,
        body.error ?? { code: "ERROR", message: "Request failed" },
        { data: body.data, requestId: body.meta?.requestId },
      );
    }

    return response;
  },
  async (error) => {
    if (!axios.isAxiosError(error) || !error.response) {
      throw new ApiError(0, "NETWORK_ERROR", error.message || "Network request failed");
    }

    const { status, data, config: reqConfig } = error.response;
    const envelope = data as ApiEnvelope<unknown> | undefined;
    const requestId = envelope?.meta?.requestId;
    const url = reqConfig?.url ?? "";
    const isAuthRoute = url.includes("/auth/login") || url.includes("/auth/register");

    const accountBlocked =
      envelope?.error?.message?.toLowerCase().includes("blocked") ?? false;

    if (!isAuthRoute && (status === 401 || (status === 403 && accountBlocked))) {
      await unauthorizedHandler?.();
    }

    if (status === 402 && envelope?.error?.code === "PAYMENT_FAILED") {
      const paymentData = (envelope.data ?? {}) as PaymentFailedData;
      throw new PaymentFailedError(
        envelope.error.message ?? "Payment could not be completed",
        paymentData,
        requestId,
      );
    }

    if (envelope?.error) {
      throw ApiError.fromBody(status, envelope.error, {
        data: envelope.data,
        requestId,
      });
    }

    throw new ApiError(status, "HTTP_ERROR", error.message || `HTTP ${status}`, { requestId });
  },
);

function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success || envelope.data === undefined) {
    throw new ApiError(
      500,
      "INVALID_ENVELOPE",
      "Successful response missing data field",
      { requestId: envelope.meta?.requestId },
    );
  }
  return envelope.data;
}

/**
 * Typed API helper — unwraps `{ success, data, meta }`.
 */
export async function apiRequest<T>(
  method: "get" | "post" | "patch" | "put" | "delete",
  path: string,
  options?: {
    body?: unknown;
    config?: ApiRequestConfig;
  },
): Promise<{ data: T; meta?: ApiEnvelope<T>["meta"] }> {
  const response = await axiosInstance.request<ApiEnvelope<T>>({
    method,
    url: path,
    data: options?.body,
    ...options?.config,
  });

  const envelope = response.data;
  const data = unwrap(envelope);
  return { data, meta: envelope.meta };
}

export { axiosInstance as apiClient };
