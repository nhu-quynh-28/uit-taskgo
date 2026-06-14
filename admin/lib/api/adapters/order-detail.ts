import type { Order } from "@/lib/mock-data";
import { mapApiOrderToOrder, type ApiOrder } from "./orders";

/** Full order payload from GET /api/orders/:id */
export type ApiOrderDetail = ApiOrder & {
  address: string;
  notes?: string;
  scheduledAt?: string;
  acceptedAt?: string;
  completedAt?: string;
  updatedAt?: string;
};

export type OrderDetail = Order & {
  address: string;
};

export function mapApiOrderToOrderDetail(
  api: ApiOrderDetail,
  names: { customer: string; tasker: string },
): OrderDetail {
  return {
    ...mapApiOrderToOrder(api, names),
    address: api.address,
  };
}
