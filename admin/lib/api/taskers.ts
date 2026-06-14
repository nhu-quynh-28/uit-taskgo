import type { Tasker } from "@/lib/mock-data";
import { apiRequest, ApiError } from "./client";
import { cacheUserProfile } from "./orders";
import { mapApiTaskerUserToTasker, type ApiTaskerUser } from "./adapters/taskers";

export async function fetchTaskersForAdmin(): Promise<Tasker[]> {
  const users = await apiRequest<ApiTaskerUser[]>("/users/taskers", { allowLive: true });
  for (const user of users) {
    cacheUserProfile(user);
  }
  return users
    .filter((u) => u.role === "tasker")
    .map(mapApiTaskerUserToTasker);
}

export async function fetchTaskerDetailForAdmin(taskerId: string): Promise<Tasker> {
  const user = await apiRequest<ApiTaskerUser>(`/users/${taskerId}`, { allowLive: true });
  console.log(">>> [ADMIN PANEL CHECK] Data nhận được từ API:", user);
  console.log(">>> [ADMIN PANEL CHECK] user.kyc từ API:", user.kyc);
  if (user.role !== "tasker") {
    throw new ApiError(404, "NOT_FOUND", "Tasker not found");
  }
  cacheUserProfile(user);
  return mapApiTaskerUserToTasker(user);
}

export async function verifyTaskerForAdmin(taskerId: string): Promise<Tasker> {
  const user = await apiRequest<ApiTaskerUser>(`/taskers/${taskerId}/verify`, {
    method: "PATCH",
    allowLive: true,
  });
  cacheUserProfile(user);
  return mapApiTaskerUserToTasker(user);
}

export async function rejectTaskerForAdmin(taskerId: string): Promise<Tasker> {
  const user = await apiRequest<ApiTaskerUser>(`/taskers/${taskerId}/reject`, {
    method: "PATCH",
    allowLive: true,
  });
  cacheUserProfile(user);
  return mapApiTaskerUserToTasker(user);
}

export type { ApiTaskerUser };
