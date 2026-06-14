import type { Customer, Order } from "@/lib/mock-data";
import { apiRequest, ApiError } from "./client";
import { cacheUserProfile } from "./orders";
import type { ApiOrder } from "./adapters/orders";
import { mapApiOrderToOrder } from "./adapters/orders";
import {
  mapApiCustomerUserToCustomer,
  type ApiCustomerUser,
} from "./adapters/customers";

/** Session-scoped cache for customer user payloads (GET /users/:id). */
const customerUserCache = new Map<string, ApiCustomerUser>();
const customerUserInflight = new Map<string, Promise<ApiCustomerUser | null>>();

async function fetchCustomerUser(userId: string): Promise<ApiCustomerUser | null> {
  const cached = customerUserCache.get(userId);
  if (cached) return cached;

  let inflight = customerUserInflight.get(userId);
  if (!inflight) {
    inflight = apiRequest<ApiCustomerUser>(`/users/${userId}`, { allowLive: true })
      .then((user) => {
        if (user.role !== "customer") return null;
        customerUserCache.set(user.id, user);
        cacheUserProfile(user);
        return user;
      })
      .catch(() => null)
      .finally(() => {
        customerUserInflight.delete(userId);
      });
    customerUserInflight.set(userId, inflight);
  }

  return inflight;
}

function orderCountsByCustomerId(orders: ApiOrder[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const order of orders) {
    counts.set(order.customerId, (counts.get(order.customerId) ?? 0) + 1);
  }
  return counts;
}

/**
 * Lists customers via existing APIs (no GET /users/customers yet):
 * 1. GET /orders — unique customerId values
 * 2. GET /users/:id — profile per customer
 */
export async function fetchCustomersForAdmin(): Promise<Customer[]> {
  const orders = await apiRequest<ApiOrder[]>("/orders", { allowLive: true });
  const counts = orderCountsByCustomerId(orders);
  const customerIds = [...counts.keys()];

  const users = await Promise.all(customerIds.map((id) => fetchCustomerUser(id)));

  return users
    .filter((user): user is ApiCustomerUser => user !== null)
    .map((user) => mapApiCustomerUserToCustomer(user, counts.get(user.id) ?? 0))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchCustomerDetailForAdmin(customerId: string): Promise<Customer> {
  const user = await fetchCustomerUser(customerId);
  if (!user) {
    throw new ApiError(404, "NOT_FOUND", "Customer not found");
  }

  const orders = await apiRequest<ApiOrder[]>("/orders", { allowLive: true });
  const ordersCount = orders.filter((o) => o.customerId === customerId).length;

  return mapApiCustomerUserToCustomer(user, ordersCount);
}

export async function fetchCustomerOrdersForAdmin(
  customerId: string,
  customerName: string,
): Promise<Order[]> {
  const orders = await apiRequest<ApiOrder[]>("/orders", { allowLive: true });

  return orders
    .filter((o) => o.customerId === customerId)
    .map((o) =>
      mapApiOrderToOrder(o, {
        customer: customerName,
        tasker: o.taskerId ? "—" : "Unassigned",
      }),
    )
    .sort((a, b) => {
      try {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } catch {
        return 0;
      }
    });
}

export type { ApiCustomerUser };
