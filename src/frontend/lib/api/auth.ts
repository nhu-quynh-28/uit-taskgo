import { apiRequest } from "./client";
import type { AuthSession, UserDTO } from "./types";

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  name: string;
  role: "customer" | "tasker";
  phone?: string;
};

export async function loginRequest(input: LoginInput): Promise<AuthSession> {
  const { data } = await apiRequest<AuthSession>("post", "/auth/login", {
    body: {
      email: input.email.trim().toLowerCase(),
      password: input.password,
    },
    config: { skipAuth: true },
  });
  return data;
}

export async function registerRequest(input: RegisterInput): Promise<AuthSession> {
  const { data } = await apiRequest<AuthSession>("post", "/auth/register", {
    body: {
      email: input.email.trim().toLowerCase(),
      password: input.password,
      name: input.name.trim(),
      role: input.role,
      phone: input.phone?.trim() || "",
    },
    config: { skipAuth: true },
  });
  return data;
}

export async function fetchMeRequest(): Promise<UserDTO> {
  const { data } = await apiRequest<UserDTO>("get", "/users/me");
  return data;
}
