import { apiRequest } from "./client";
import type { OrderDTO } from "./types";

export type CreateOrderInput = {
  serviceName: string;
  address: string;
  scheduledAt?: string;
  bookingType?: "instant" | "scheduled";
  serviceId?: string;
  /** Catalog icon key — used by backend pricing lookup when serviceId is stale. */
  serviceType?: string;
  notes?: string;
  location?: { lat: number; lng: number };
};

type PaginatedOrdersResponse = {
  items: OrderDTO[];
  total: number;
  page: number;
  limit: number;
};

export async function listOrdersRequest(): Promise<OrderDTO[]> {
  const { data } = await apiRequest<OrderDTO[] | PaginatedOrdersResponse>("get", "/orders");
  if (Array.isArray(data)) return data;
  return Array.isArray(data.items) ? data.items : [];
}

export async function getCurrentPendingPaymentOrderRequest(): Promise<OrderDTO | null> {
  const { data } = await apiRequest<OrderDTO | null>("get", "/orders/current-pending-payment");
  return data ?? null;
}

export async function getOrderRequest(orderId: string): Promise<OrderDTO> {
  const { data } = await apiRequest<OrderDTO>("get", `/orders/${orderId}`);
  return data;
}

export async function createOrderRequest(input: CreateOrderInput): Promise<OrderDTO> {
  const { data } = await apiRequest<OrderDTO>("post", "/orders", { body: input });
  return data;
}

export async function publishOrderRequest(orderId: string): Promise<{ order: OrderDTO }> {
  const { data } = await apiRequest<{ order: OrderDTO }>("post", `/orders/${orderId}/publish`);
  return data;
}

export async function cancelOrderRequest(orderId: string): Promise<OrderDTO> {
  const { data } = await apiRequest<OrderDTO>("post", `/orders/${orderId}/cancel`);
  return data;
}

export async function acceptOrderRequest(
  orderId: string,
  idempotencyKey: string,
): Promise<OrderDTO> {
  const { data } = await apiRequest<OrderDTO>("post", `/orders/${orderId}/accept`, {
    config: { headers: { "Idempotency-Key": idempotencyKey } },
  });
  return data;
}

export async function arriveOrderRequest(orderId: string): Promise<OrderDTO> {
  const { data } = await apiRequest<OrderDTO>("post", `/orders/${orderId}/arrive`);
  return data;
}

export async function startOrderRequest(orderId: string): Promise<OrderDTO> {
  const { data } = await apiRequest<OrderDTO>("post", `/orders/${orderId}/start`);
  return data;
}

export async function completeOrderRequest(orderId: string): Promise<OrderDTO> {
  const { data } = await apiRequest<{ order: OrderDTO }>("post", `/orders/${orderId}/complete`);
  return data.order;
}
