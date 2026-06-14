import { apiRequest } from "./client";
import type { OrderDTO } from "./types";

export type PayOrderResult = {
  success: boolean;
  payment?: unknown;
  trace?: unknown;
  order: OrderDTO;
  message?: string;
  retryable?: boolean;
};

export type PayOSCheckoutLink = {
  checkoutUrl: string;
  paymentLinkId?: string;
  orderId: string;
  payosOrderCode: number;
};

export async function createPayOSCheckoutLinkRequest(orderId: string): Promise<PayOSCheckoutLink> {
  const { data } = await apiRequest<PayOSCheckoutLink>("post", "/payment/create", {
    body: { orderId },
  });
  return data;
}

export async function payOrderRequest(
  orderId: string,
  body: { simulateFail?: boolean; simulateTimeout?: boolean } = {},
  idempotencyKey?: string,
): Promise<PayOrderResult> {
  try {
    const { data } = await apiRequest<PayOrderResult>("post", `/orders/${orderId}/pay`, {
      body,
      config: idempotencyKey
        ? { headers: { "Idempotency-Key": idempotencyKey } }
        : undefined,
    });
    return data;
  } catch (error) {
    throw error;
  }
}
