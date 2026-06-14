import { format } from "date-fns";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/mock-data";

/** Shape returned by GET /api/orders */
export type ApiOrder = {
  id: string;
  customerId: string;
  taskerId: string | null;
  serviceName: string;
  subtotal: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  scheduledAt?: string;
};

export function mapOrderStatus(status: string): OrderStatus {
  switch (status) {
    case "pending":
      return "pending";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    case "accepted":
    case "arrived":
    case "in_progress":
    case "pending_payment":
      return "ongoing";
    default:
      return "pending";
  }
}

export function mapPaymentStatus(status: string): PaymentStatus {
  switch (status) {
    case "paid":
      return "paid";
    case "failed":
      return "failed";
    case "refunded":
      return "refunded";
    default:
      return "unpaid";
  }
}

function formatOrderDate(iso: string): string {
  try {
    return format(new Date(iso), "MMM d, yyyy");
  } catch {
    return iso;
  }
}

export function mapApiOrderToOrder(
  api: ApiOrder,
  names: { customer: string; tasker: string },
): Order {
  return {
    id: api.id,
    customer: names.customer,
    tasker: names.tasker,
    service: api.serviceName,
    amount: api.subtotal,
    status: mapOrderStatus(api.status),
    payment: mapPaymentStatus(api.paymentStatus),
    date: formatOrderDate(api.createdAt),
  };
}
