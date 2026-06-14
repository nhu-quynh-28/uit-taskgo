import { format } from "date-fns";
import type { AccountStatus, Tasker, TaskerKyc, VerificationStatus } from "@/lib/mock-data";
import { mapApiAccountStatus } from "./moderation";

export type ApiTaskerKyc = {
  fullName?: string;
  dob?: string;
  address?: string;
  phone?: string;
  cccdFront?: string;
  cccdBack?: string;
  submittedAt?: string;
};

function trimOrEmpty(value: unknown): string | undefined {
  if (value == null) return undefined;
  const s = String(value).trim();
  return s.length > 0 ? s : undefined;
}

/** Accepts base64 data URIs or legacy { persistUri, previewUri } shapes from Mongo. */
function coerceKycImageSrc(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === "object") {
    const o = value as { persistUri?: string; previewUri?: string };
    return trimOrEmpty(o.persistUri) ?? trimOrEmpty(o.previewUri);
  }
  return undefined;
}

/** Maps GET /users/:id `kyc` payload → admin TaskerKyc (null when empty). */
export function normalizeApiTaskerKyc(raw: unknown): TaskerKyc | null {
  if (!raw || typeof raw !== "object") return null;

  const row = raw as Record<string, unknown>;
  const fullName = trimOrEmpty(row.fullName);
  const dob = trimOrEmpty(row.dob);
  const address = trimOrEmpty(row.address);
  const phone = trimOrEmpty(row.phone);
  const cccdFront = coerceKycImageSrc(row.cccdFront);
  const cccdBack = coerceKycImageSrc(row.cccdBack);
  const submittedAt = trimOrEmpty(row.submittedAt);

  if (!fullName && !dob && !address && !phone && !cccdFront && !cccdBack && !submittedAt) {
    return null;
  }

  return { fullName, dob, address, phone, cccdFront, cccdBack, submittedAt };
}

/** User record from GET /users/taskers or GET /users/:id (tasker role). */
export type ApiTaskerUser = {
  id: string;
  email: string;
  role: string;
  name: string;
  phone?: string;
  avatar?: string | null;
  online?: boolean;
  averageRating?: number;
  totalReviews?: number;
  createdAt?: string;
  accountStatus?: string;
  verificationStatus?: string;
  kyc?: ApiTaskerKyc | null;
};

export const DEFAULT_VERIFICATION_STATUS: VerificationStatus = "pending";
export const DEFAULT_ACCOUNT_STATUS: AccountStatus = "active";

function mapVerificationStatus(value?: string | null): VerificationStatus {
  if (value === "verified" || value === "rejected" || value === "pending") {
    return value;
  }
  return DEFAULT_VERIFICATION_STATUS;
}

const DEFAULT_CATEGORY = "General";
const DEFAULT_AVATAR = (seed: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

function formatJoinDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "MMM yyyy");
  } catch {
    return iso;
  }
}

/**
 * Maps API user → admin Tasker view model.
 *
 * verificationStatus → Tasker.verified (admin decision; not inferred from reviews)
 * accountStatus      → Tasker.status (active / blocked moderation)
 *
 * Rating and job metrics are display-only post-marketplace signals.
 */
export function mapApiTaskerUserToTasker(user: ApiTaskerUser): Tasker {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone?.trim() || "—",
    avatar: user.avatar || DEFAULT_AVATAR(user.id),
    rating: user.averageRating ?? 0,
    jobs: 0,
    earnings: 0,
    online: Boolean(user.online),
    verified: mapVerificationStatus(user.verificationStatus),
    status: user.accountStatus !== undefined
      ? mapApiAccountStatus(user.accountStatus)
      : DEFAULT_ACCOUNT_STATUS,
    category: DEFAULT_CATEGORY,
    joinDate: formatJoinDate(user.createdAt),
    kyc: normalizeApiTaskerKyc(user.kyc),
  };
}
