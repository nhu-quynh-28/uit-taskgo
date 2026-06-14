import request from "supertest";
import { CORE_IDS } from "../../backend/src/seed/constants.js";

/**
 * Drive order-sample-pending through accept → arrive → start → complete (pending_payment).
 */
export async function completeOrderToPendingPayment(app, customerToken, taskerToken) {
  const orderId = CORE_IDS.orderPending;
  const steps = ["accept", "arrive", "start", "complete"];

  for (const step of steps) {
    const res = await request(app)
      .post(`/api/orders/${orderId}/${step}`)
      .set("Authorization", `Bearer ${taskerToken}`)
      .set("Idempotency-Key", `flow-${step}-${Date.now()}`);

    if (res.status >= 400) {
      throw new Error(`${step} failed: ${res.status} ${JSON.stringify(res.body)}`);
    }
  }

  const view = await request(app)
    .get(`/api/orders/${orderId}`)
    .set("Authorization", `Bearer ${customerToken}`);

  return { orderId, order: view.body.data };
}
