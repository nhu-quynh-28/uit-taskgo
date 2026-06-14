/**
 * ASR Security — JWT rejection latency (< 100ms).
 *
 * Env: JWT_SECRET (via tests/setup.integration.js), REPOSITORY_DRIVER=inMemory (default).
 */
import request from "supertest";
import { performance } from "node:perf_hooks";
import { getTestApp } from "../helpers/testApp.js";
import { recordAsrScenario } from "../helpers/recordAsr.js";

const PROTECTED_ROUTE = "/api/users/me";
const MAX_REJECT_MS = 100;

async function measureUnauthorized(app, headers = {}) {
  const start = performance.now();
  const res = await request(app).get(PROTECTED_ROUTE).set(headers);
  const elapsedMs = performance.now() - start;
  return { res, elapsedMs };
}

describe("ASR Security — auth rejection", () => {
  const rejectTimes = [];

  afterAll(() => {
    if (rejectTimes.length === 0) return;
    const rejectMs = Math.max(...rejectTimes);
    recordAsrScenario({
      id: "sec.auth.jwt",
      status: rejectMs < MAX_REJECT_MS ? "passed" : "failed",
      suite: "integration",
      metrics: { rejectMs },
      message: `JWT 401 rejection max ${rejectMs.toFixed(1)}ms (budget < ${MAX_REJECT_MS}ms)`,
    });
  });

  test("returns 401 without token in under 100ms", async () => {
    const app = await getTestApp();
    const { res, elapsedMs } = await measureUnauthorized(app);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
    expect(elapsedMs).toBeLessThan(MAX_REJECT_MS);
    rejectTimes.push(elapsedMs);
  });

  test("returns 401 for malformed bearer token in under 100ms", async () => {
    const app = await getTestApp();
    const { res, elapsedMs } = await measureUnauthorized(app, {
      Authorization: "Bearer not-a-valid-jwt",
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
    expect(elapsedMs).toBeLessThan(MAX_REJECT_MS);
    rejectTimes.push(elapsedMs);
  });

  test("returns 401 for expired/tampered token in under 100ms", async () => {
    const app = await getTestApp();
    const { res, elapsedMs } = await measureUnauthorized(app, {
      Authorization:
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmYWtlIn0.invalid-signature",
    });

    expect(res.status).toBe(401);
    expect(elapsedMs).toBeLessThan(MAX_REJECT_MS);
    rejectTimes.push(elapsedMs);
  });
});
