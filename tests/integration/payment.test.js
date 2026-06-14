/**
 * ASR Availability — PayOS / provider timeout (Promise.race) & graceful degradation.
 *
 * Uses POST /api/orders/:id/pay with simulateTimeout (mock provider hangs, 5s cap).
 * Env: PAYOS_MOCK_TIMEOUT_MS=5000 (default in setup.integration.js).
 */
import request from "supertest";
import { performance } from "node:perf_hooks";
import { getTestApp } from "../helpers/testApp.js";
import { login } from "../helpers/auth.js";
import { completeOrderToPendingPayment } from "../helpers/orderFlow.js";
import { recordAsrScenario } from "../helpers/recordAsr.js";

const PAYOS_TIMEOUT_MS = Number(process.env.PAYOS_MOCK_TIMEOUT_MS || 5000);

describe("ASR Availability — payment timeout", () => {
  test("simulateTimeout: responds without hanging; order stays pending_payment", async () => {
    const app = await getTestApp();
    const customerToken = await login(app, "customer@taskgo.app");
    const taskerToken = await login(app, "tasker1@taskgo.app");

    const { orderId, order: beforePay } = await completeOrderToPendingPayment(
      app,
      customerToken,
      taskerToken,
    );
    expect(beforePay.status).toBe("pending_payment");

    const start = performance.now();
    const pay = await request(app)
      .post(`/api/orders/${orderId}/pay`)
      .set("Authorization", `Bearer ${customerToken}`)
      .set("Idempotency-Key", `pay-timeout-${orderId}`)
      .send({ simulateTimeout: true });

    const elapsedMs = performance.now() - start;

    expect(pay.status).toBe(402);
    expect(pay.body.success).toBe(false);
    expect(pay.body.data.order.status).toBe("pending_payment");
    expect(pay.body.data.order.paymentStatus).toBe("failed");
    expect(pay.body.data.retryable).toBe(true);
    expect(elapsedMs).toBeGreaterThanOrEqual(PAYOS_TIMEOUT_MS - 200);
    expect(elapsedMs).toBeLessThan(PAYOS_TIMEOUT_MS + 3000);

    recordAsrScenario({
      id: "avail.payment.timeout",
      status: "passed",
      suite: "integration",
      metrics: {
        timeoutMs: PAYOS_TIMEOUT_MS,
        observedMs: Math.round(elapsedMs),
        orderStatus: pay.body.data.order.status,
      },
      message: `Promise.race ngắt sau ${Math.round(elapsedMs)}ms, đơn ở trạng thái ${pay.body.data.order.status}.`,
    });
  });

  test("simulateFail: API returns structured failure without crashing", async () => {
    const app = await getTestApp();
    const customerToken = await login(app, "customer@taskgo.app");
    const taskerToken = await login(app, "tasker1@taskgo.app");
    const { orderId } = await completeOrderToPendingPayment(app, customerToken, taskerToken);

    const pay = await request(app)
      .post(`/api/orders/${orderId}/pay`)
      .set("Authorization", `Bearer ${customerToken}`)
      .set("Idempotency-Key", `pay-fail-${orderId}`)
      .send({ simulateFail: true });

    expect(pay.status).toBe(402);
    expect(pay.body.data.order.paymentStatus).toBe("failed");
    expect(pay.body.data.order.status).toBe("pending_payment");
  });
});

describe("ASR Availability — payOS createPaymentLink stall (unit mock)", () => {
  test("hung createPaymentLink can be raced with a 5s timeout wrapper", async () => {
    const { withPayosTimeout } = await import("../helpers/payosTimeout.js");

    const hungLink = () =>
      new Promise(() => {
        /* never resolves — simulates network stall */
      });

    const start = performance.now();
    await expect(
      withPayosTimeout(hungLink(), PAYOS_TIMEOUT_MS),
    ).rejects.toThrow("PAYOS_TIMEOUT");
    expect(performance.now() - start).toBeGreaterThanOrEqual(PAYOS_TIMEOUT_MS - 100);
    expect(performance.now() - start).toBeLessThan(PAYOS_TIMEOUT_MS + 500);
  });

  test("createPaymentLink network error surfaces as rejection", async () => {
    const { withPayosTimeout } = await import("../helpers/payosTimeout.js");
    const failing = () => Promise.reject(new Error("ECONNRESET"));

    await expect(withPayosTimeout(failing(), 1000)).rejects.toThrow("ECONNRESET");
  });
});
