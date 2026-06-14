import { format } from "date-fns";
import type { AccountStatus, Customer } from "@/lib/mock-data";
import { mapApiAccountStatus } from "./moderation";

/** User record from GET /users/:id (customer role). */
export type ApiCustomerUser = {
  id: string;
  email: string;
  role: string;
  name: string;
  phone?: string;
  avatar?: string | null;
  createdAt?: string;
  accountStatus?: string;
};

export const DEFAULT_CUSTOMER_ACCOUNT_STATUS: AccountStatus = "active";

const DEFAULT_AVATAR = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

function formatJoinedDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "MMM yyyy");
  } catch {
    return iso;
  }
}

/**
 * Maps API user → admin Customer view model.
 * accountStatus → Customer.status (active / blocked moderation)
 */
export function mapApiCustomerUserToCustomer(
  user: ApiCustomerUser,
  ordersCount: number,
): Customer {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone?.trim() || "—",
    avatar: user.avatar || DEFAULT_AVATAR(user.id),
    orders: ordersCount,
    joined: formatJoinedDate(user.createdAt),
    status: user.accountStatus !== undefined
      ? mapApiAccountStatus(user.accountStatus)
      : DEFAULT_CUSTOMER_ACCOUNT_STATUS,
  };
}
