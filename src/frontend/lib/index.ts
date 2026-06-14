/**
 * TaskGo client infrastructure (Phase 1).
 * Not wired to screens until Phase 2+.
 */

export { config } from "./config";
export { createIdempotencyKey, createRequestId } from "./idempotency";
export {
  clearAccessToken,
  getAccessToken,
  hasAccessToken,
  setAccessToken,
} from "./storage/token";
export {
  apiClient,
  apiRequest,
  setUnauthorizedHandler,
  type ApiRequestConfig,
  type UnauthorizedHandler,
} from "./api/client";
export { ApiError, PaymentFailedError, isApiError, isPaymentFailedError } from "./api/errors";
export type {
  ApiEnvelope,
  ApiMeta,
  AuthSession,
  OrderDTO,
  PaymentFailedData,
  UserDTO,
} from "./api/types";
export { loginRequest, registerRequest, fetchMeRequest } from "./api/auth";
export type { LoginInput, RegisterInput } from "./api/auth";
export { authErrorMessage } from "./auth/messages";
export { dtoRoleToAppRole, userDtoToProfileUser } from "./auth/mapUser";
export {
  connectSocket,
  disconnectSocket,
  getSocket,
  isSocketConnected,
  type SocketAuthPayload,
} from "./socket/client";
