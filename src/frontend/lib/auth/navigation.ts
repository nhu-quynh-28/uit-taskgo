import type { UserDTO } from "../api/types";

export type PostAuthScreen =
  | "login"
  | "home"
  | "tDashboard"
  | "tDocuments"
  | "tPending"
  | "tRejected";

export type PostAuthOptions = {
  /** Local KYC form submitted (awaiting admin review). */
  kycSubmitted?: boolean;
};

export function isUserBlocked(dto: UserDTO): boolean {
  return dto.accountStatus === "blocked";
}

export function isTaskerVerified(dto: UserDTO): boolean {
  return dto.verificationStatus === "verified";
}

export function getPostAuthScreen(dto: UserDTO, opts?: PostAuthOptions): PostAuthScreen {
  if (isUserBlocked(dto)) return "login";
  if (dto.role === "tasker") {
    if (dto.verificationStatus === "rejected") return "tRejected";
    if (dto.verificationStatus === "verified") return "tDashboard";
    if (!opts?.kycSubmitted) return "tDocuments";
    return "tPending";
  }
  return "home";
}
