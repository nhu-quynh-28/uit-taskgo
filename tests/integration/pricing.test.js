/**
 * ASR Security — pricing integrity (client cannot set price/total).
 *
 * Uses catalog service `service-deep-cleaning` basePrice = 49 USD.
 * Scheduled booking adds schedulingFee (5) + platformFee (5) => total 59.
 */
import request from "supertest";
import { getTestApp } from "../helpers/testApp.js";
import { login } from "../helpers/auth.js";
import { SERVICE_IDS } from "../../backend/seed/constants.js";
import { PLATFORM_FEE, SCHEDULING_FEE } from "../../backend/src/config/pricing.js";
import { recordAsrScenario } from "../helpers/recordAsr.js";

const EXPECTED_BASE = 49;
const EXPECTED_TOTAL = EXPECTED_BASE + SCHEDULING_FEE + PLATFORM_FEE;

describe("ASR Security — pricing integrity", () => {
  test("ignores spoofed price/total and persists catalog pricing", async () => {
    const app = await getTestApp();
    const customerToken = await login(app, "customer@taskgo.app");

    const create = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        serviceName: "Deep Home Cleaning",
        serviceId: SERVICE_IDS.deepCleaning,
        address: "12 Nguyen Trai, Ward 5, District 1, Ho Chi Minh City",
        scheduledAt: "2026-06-15T10:00:00.000Z",
        bookingType: "scheduled",
        price: 10,
        total: 10,
        subtotal: 10,
        amount: 10,
        location: { lat: 10.772, lng: 106.6982 },
      });

    expect(create.status).toBe(201);
    const order = create.body.data;

    expect(order.subtotal).toBe(EXPECTED_BASE);
    expect(order.pricing.subtotal).toBe(EXPECTED_BASE);
    expect(order.pricing.schedulingFee).toBe(SCHEDULING_FEE);
    expect(order.pricing.platformFee).toBe(PLATFORM_FEE);
    expect(order.pricing.total).toBe(EXPECTED_TOTAL);

    const fetched = await request(app)
      .get(`/api/orders/${order.id}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(fetched.status).toBe(200);
    expect(fetched.body.data.pricing.total).toBe(EXPECTED_TOTAL);
    expect(fetched.body.data.subtotal).toBe(EXPECTED_BASE);

    recordAsrScenario({
      id: "sec.pricing.integrity",
      status: "passed",
      suite: "integration",
      metrics: {
        catalogSubtotal: EXPECTED_BASE,
        chargedTotal: EXPECTED_TOTAL,
        clientSpoofedTotal: 10,
        resultText: `Hệ thống tự động xóa payload giả, tính lại đúng giá chuẩn từ DB (subtotal ${EXPECTED_BASE} USD, total ${EXPECTED_TOTAL} USD).`,
      },
      message:
        `Hệ thống tự động xóa payload giả (total=10), tính lại đúng giá chuẩn từ DB (subtotal=${EXPECTED_BASE}, total=${EXPECTED_TOTAL}).`,
    });
  });
});
