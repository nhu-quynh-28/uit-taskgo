import type { AccountStatus } from "@/lib/mock-data";
import { apiRequest } from "./client";
import {
  mapApiAccountStatus,
  type ModerationApplyResult,
} from "./adapters/moderation";

type ApiUserModerationResponse = {
  id: string;
  accountStatus?: string;
};

/** Block or unblock a customer via PATCH /users/:id/block|unblock. */
export async function setCustomerAccountStatusForAdmin(
  userId: string,
  status: AccountStatus,
): Promise<ModerationApplyResult> {
  const action = status === "blocked" ? "block" : "unblock";
  const user = await apiRequest<ApiUserModerationResponse>(`/users/${userId}/${action}`, {
    method: "PATCH",
    allowLive: true,
  });
  const persisted = mapApiAccountStatus(user.accountStatus);
  return { applied: "api", status: persisted, fallback: false };
}

/** Block or unblock a tasker via PATCH /taskers/:id/block|unblock. */
export async function setTaskerAccountStatusForAdmin(
  taskerId: string,
  status: AccountStatus,
): Promise<ModerationApplyResult> {
  const action = status === "blocked" ? "block" : "unblock";
  const user = await apiRequest<ApiUserModerationResponse>(`/taskers/${taskerId}/${action}`, {
    method: "PATCH",
    allowLive: true,
  });
  const persisted = mapApiAccountStatus(user.accountStatus);
  return { applied: "api", status: persisted, fallback: false };
}

/** @deprecated Use setCustomerAccountStatusForAdmin or setTaskerAccountStatusForAdmin. */
export async function setUserAccountStatusForAdmin(
  userId: string,
  status: AccountStatus,
): Promise<ModerationApplyResult> {
  return setCustomerAccountStatusForAdmin(userId, status);
}

export type { ModerationApplyResult };
