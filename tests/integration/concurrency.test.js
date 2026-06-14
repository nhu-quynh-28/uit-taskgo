/**
 * ASR Security — race: two taskers accept one PENDING order (200 + 409).
 *
 * Default: in-memory repo (atomic acceptIfPending mutex).
 * MongoDB: set RUN_MONGO_TESTS=true, REPOSITORY_DRIVER=mongo, MONGODB_URI=...
 */
import request from "supertest";
import { getTestApp } from "../helpers/testApp.js";
import { login } from "../helpers/auth.js";
import { SERVICE_IDS } from "../../backend/seed/constants.js";
import { CORE_IDS } from "../../backend/src/seed/constants.js";
import { recordAsrScenario } from "../helpers/recordAsr.js";

const RUN_MONGO = process.env.RUN_MONGO_TESTS === "true";
const describeMongo = RUN_MONGO ? describe : describe.skip;

async function createPendingOrder(app, customerToken) {
  const res = await request(app)
    .post("/api/orders")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({
      serviceName: "Deep Home Cleaning",
      serviceId: SERVICE_IDS.deepCleaning,
      address: "12 Nguyen Trai, Ward 5, District 1, Ho Chi Minh City",
      scheduledAt: "2026-06-20T10:00:00.000Z",
      bookingType: "scheduled",
      location: { lat: 10.772, lng: 106.6982 },
    });

  expect(res.status).toBe(201);
  return res.body.data.id;
}

async function raceAccept(app, orderId, tokenA, tokenB) {
  const path = `/api/orders/${orderId}/accept`;
  const mk = (token, key) =>
    request(app)
      .post(path)
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", key);

  return Promise.all([
    mk(tokenA, `race-a-${orderId}-${Date.now()}`),
    mk(tokenB, `race-b-${orderId}-${Date.now()}`),
  ]);
}

describe("ASR Security — accept race (in-memory)", () => {
  test("Promise.all: exactly one 200 and one 409", async () => {
    const app = await getTestApp();
    const customerToken = await login(app, "customer@taskgo.app");
    const t1 = await login(app, "tasker1@taskgo.app");
    const t2 = await login(app, "tasker2@taskgo.app");

    const orderId = await createPendingOrder(app, customerToken);
    const [a, b] = await raceAccept(app, orderId, t1, t2);

    const statuses = [a.status, b.status].sort((x, y) => x - y);
    expect(statuses).toEqual([200, 409]);

    const winner = a.status === 200 ? a : b;
    const loser = a.status === 409 ? a : b;
    expect(winner.body.data.status).toBe("accepted");
    expect(loser.body.error.code).toBe("CONFLICT");

    const verify = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${customerToken}`);
    expect(verify.body.data.taskerId).toBe(winner.body.data.taskerId);
    expect(verify.body.data.status).toBe("accepted");

    recordAsrScenario({
      id: "sec.concurrency.accept",
      status: "passed",
      suite: "integration",
      metrics: {
        winnerStatus: winner.status,
        loserStatus: loser.status,
        resultText: `Thử nghiệm bắn đồng thời 2 request. Kết quả: [1 Request đạt ${winner.status} | 1 Request đạt ${loser.status}].`,
      },
    });
  });
});

describeMongo("ASR Security — accept race (MongoDB)", () => {
  beforeAll(() => {
    process.env.REPOSITORY_DRIVER = "mongo";
    if (!process.env.MONGODB_URI) {
      throw new Error("RUN_MONGO_TESTS=true requires MONGODB_URI");
    }
  });

  test("atomic acceptIfPending under concurrent load", async () => {
    const app = await getTestApp();
    const customerToken = await login(app, "customer@taskgo.app");
    const t1 = await login(app, "tasker1@taskgo.app");
    const t2 = await login(app, "tasker2@taskgo.app");

    const orderId = await createPendingOrder(app, customerToken);
    const [a, b] = await raceAccept(app, orderId, t1, t2);

    const ok = [a, b].filter((r) => r.status === 200);
    const conflict = [a, b].filter((r) => r.status === 409);
    expect(ok).toHaveLength(1);
    expect(conflict).toHaveLength(1);
    expect(conflict[0].body.error.code).toBe("CONFLICT");
  });
});
