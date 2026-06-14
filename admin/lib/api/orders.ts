import type { Order } from "@/lib/mock-data";
import { apiRequest } from "./client";
import { mapApiOrderToOrder, type ApiOrder } from "./adapters/orders";

type ApiUser = { id: string; name: string };

/** Session-scoped cache: user id → display name */
const userNameCache = new Map<string, string>();
/** Dedupes concurrent fetches for the same id */
const userNameInflight = new Map<string, Promise<string>>();

export function cacheUserProfile(user: { id: string; name: string }): void {
  userNameCache.set(user.id, user.name);
}

export async function fetchUserName(id: string): Promise<string> {
  const cached = userNameCache.get(id);
  if (cached !== undefined) return cached;

  let inflight = userNameInflight.get(id);
  if (!inflight) {
    inflight = apiRequest<ApiUser>(`/users/${id}`, { allowLive: true })
      .then((user) => user.name)
      .catch(() => id)
      .finally(() => {
        userNameInflight.delete(id);
      });
    userNameInflight.set(id, inflight);
  }

  const name = await inflight;
  userNameCache.set(id, name);
  return name;
}

async function resolveUserNames(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  await Promise.all(unique.map((id) => fetchUserName(id)));
  return new Map(unique.map((id) => [id, userNameCache.get(id) ?? id]));
}

export async function fetchOrdersForAdmin(): Promise<Order[]> {
  const apiOrders = await apiRequest<ApiOrder[]>("/orders", { allowLive: true });
  const userIds = apiOrders.flatMap((o) =>
    [o.customerId, o.taskerId].filter((id): id is string => Boolean(id)),
  );
  const nameMap = await resolveUserNames(userIds);

  return apiOrders.map((o) =>
    mapApiOrderToOrder(o, {
      customer: nameMap.get(o.customerId) ?? o.customerId,
      tasker: o.taskerId ? (nameMap.get(o.taskerId) ?? o.taskerId) : "Unassigned",
    }),
  );
}
