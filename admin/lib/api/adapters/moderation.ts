import type { AccountStatus } from "@/lib/mock-data";

export type ApiAccountStatus = "active" | "blocked" | string;

export type ModerationApplyResult = {
  applied: "api" | "local";
  status: AccountStatus;
  /** True when PATCH could not persist moderation (validation / unsupported). */
  fallback: boolean;
};

/** Payload sent once backend adds moderation to PATCH /users/:id */
export type ModerationPatchBody = {
  accountStatus: AccountStatus;
};

export function mapApiAccountStatus(value?: ApiAccountStatus | null): AccountStatus {
  return value === "blocked" ? "blocked" : "active";
}
