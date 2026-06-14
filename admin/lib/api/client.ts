const API_NOT_CONNECTED = "API client is not connected. Use mock store (VITE_USE_MOCK=true).";

export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
}

const TOKEN_KEY = "taskgo_admin_token";

export function getAuthToken(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (typeof sessionStorage === "undefined") return;
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

export function isMockMode(): boolean {
  return import.meta.env.VITE_USE_MOCK !== "false";
}

export type ApiRequestOptions = RequestInit & {
  /** Allow request when VITE_USE_MOCK is not false (e.g. auth login). */
  allowLive?: boolean;
  /** Do not attach Authorization header. */
  skipAuth?: boolean;
};

type ApiErrorBody = {
  success: false;
  error?: { code?: string; message?: string };
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { allowLive, skipAuth, headers: initHeaders, ...init } = options;

  if (isMockMode() && !allowLive) {
    return Promise.reject(new Error(API_NOT_CONNECTED));
  }

  const headers = new Headers(initHeaders);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!skipAuth) {
    const token = getAuthToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${getApiBaseUrl()}${normalizedPath}`, {
    ...init,
    headers,
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(response.status, "NETWORK_ERROR", "Unexpected response from server");
  }

  if (!response.ok || (payload as { success?: boolean }).success === false) {
    const body = payload as ApiErrorBody;
    throw new ApiError(
      response.status,
      body.error?.code ?? "REQUEST_FAILED",
      body.error?.message ?? "Request failed",
    );
  }

  return (payload as { data: T }).data;
}

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  name: string;
  phone?: string;
  avatar?: string | null;
};

export type LoginResult = {
  user: AuthUser;
  token: string;
};

export async function login(credentials: { email: string; password: string }): Promise<LoginResult> {
  return apiRequest<LoginResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
    skipAuth: true,
    allowLive: true,
  });
}

export function createApiClient() {
  return {
    getBaseUrl: getApiBaseUrl,
    getToken: getAuthToken,
    setToken: setAuthToken,
    request: apiRequest,
    login,
    isMockMode,
  };
}
