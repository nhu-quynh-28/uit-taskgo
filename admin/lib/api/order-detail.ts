import { apiRequest } from "./client";
import { fetchUserName } from "./orders";
import {
  mapApiOrderToOrderDetail,
  type ApiOrderDetail,
  type OrderDetail,
} from "./adapters/order-detail";

export async function fetchOrderDetailForAdmin(orderId: string): Promise<OrderDetail> {
  const api = await apiRequest<ApiOrderDetail>(`/orders/${orderId}`, { allowLive: true });
  const customer = await fetchUserName(api.customerId);
  const tasker = api.taskerId ? await fetchUserName(api.taskerId) : "Unassigned";

  return mapApiOrderToOrderDetail(api, { customer, tasker });
}

export type { OrderDetail };
