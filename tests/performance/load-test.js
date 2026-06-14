#!/usr/bin/env node
/**
 * ASR Performance — API latency budgets.
 *   GET  < 500ms
 *   POST < 1500ms
 *
 * Run: node tests/performance/load-test.js
 * Env: same as tests/setup.integration.js (JWT_SECRET, REPOSITORY_DRIVER=inMemory).
 */
import { createRequire } from "node:module";
import { performance } from "node:perf_hooks";

const require = createRequire(import.meta.url);
const { appendTestRun } = require("../helpers/testResultsLogger.cjs");
const { recordAsrScenario } = require("../helpers/asrMetricsStore.cjs");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "test-jwt-secret-minimum-32-characters-long";
process.env.REPOSITORY_DRIVER = process.env.REPOSITORY_DRIVER || "inMemory";
process.env.PAYOS_MOCK_FAIL_RATE = "0";

const request = (await import("supertest")).default;
const { getTestApp } = await import("../helpers/testApp.js");
const { login } = await import("../helpers/auth.js");
const { SERVICE_IDS } = await import("../../backend/seed/constants.js");

const GET_BUDGET_MS = 500;
const POST_BUDGET_MS = 1500;
const SAMPLES = Number(process.env.LOAD_TEST_SAMPLES || 5);

function percentile(sorted, p) {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function timed(fn) {
  const start = performance.now();
  const result = await fn();
  return { result, ms: performance.now() - start };
}

async function main() {
  const startedAt = performance.now();
  const app = await getTestApp();
  const customerToken = await login(app, "customer@taskgo.app");

  const getLatencies = [];
  const postLatencies = [];

  for (let i = 0; i < SAMPLES; i += 1) {
    const health = await timed(() => request(app).get("/api/health"));
    getLatencies.push(health.ms);

    const list = await timed(() =>
      request(app).get("/api/orders").set("Authorization", `Bearer ${customerToken}`),
    );
    getLatencies.push(list.ms);

    const create = await timed(() =>
      request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          serviceName: "Deep Home Cleaning",
          serviceId: SERVICE_IDS.deepCleaning,
          address: `Load test #${i}`,
          scheduledAt: "2026-08-01T10:00:00.000Z",
          location: { lat: 10.772, lng: 106.6982 },
        }),
    );
    postLatencies.push(create.ms);
    if (create.result.status !== 201) {
      console.error("POST /orders failed", create.result.status, create.result.body);
      process.exit(1);
    }
  }

  const getSorted = [...getLatencies].sort((a, b) => a - b);
  const postSorted = [...postLatencies].sort((a, b) => a - b);
  const getP95 = percentile(getSorted, 95);
  const postP95 = percentile(postSorted, 95);

  console.log("--- TaskGo load-test (local in-memory) ---");
  console.log(`GET samples: ${getLatencies.length}, p95=${getP95.toFixed(1)}ms (budget < ${GET_BUDGET_MS}ms)`);
  console.log(
    `POST samples: ${postLatencies.length}, p95=${postP95.toFixed(1)}ms (budget < ${POST_BUDGET_MS}ms)`,
  );

  let failed = false;
  if (getP95 >= GET_BUDGET_MS) {
    console.error(`FAIL: GET p95 ${getP95.toFixed(1)}ms exceeds ${GET_BUDGET_MS}ms`);
    failed = true;
  }
  if (postP95 >= POST_BUDGET_MS) {
    console.error(`FAIL: POST p95 ${postP95.toFixed(1)}ms exceeds ${POST_BUDGET_MS}ms`);
    failed = true;
  }

  if (!failed) {
    console.log("PASS: latency budgets met.");
  }

  const { logFile } = appendTestRun({
    suite: "performance:load",
    status: failed ? "failed" : "passed",
    passed: failed ? 0 : 1,
    failed: failed ? 1 : 0,
    total: 1,
    durationMs: performance.now() - startedAt,
    message: failed ? "Latency budget exceeded" : "Latency budgets met",
    details: { getP95, postP95, getBudgetMs: GET_BUDGET_MS, postBudgetMs: POST_BUDGET_MS, samples: SAMPLES },
  });
  recordAsrScenario({
    id: "perf.api.response",
    status: failed ? "failed" : "passed",
    suite: "performance:load",
    metrics: {
      getMs: Math.round(getP95 * 10) / 10,
      postMs: Math.round(postP95 * 10) / 10,
    },
  });
  console.log(`[test-results] Appended run → ${logFile}`);

  const { main: generateAsrReport } = require("../scripts/generate-asr-report.cjs");
  generateAsrReport();

  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  appendTestRun({
    suite: "performance:load",
    status: "failed",
    failed: 1,
    total: 1,
    message: err?.message ?? String(err),
  });
  console.error(err);
  process.exit(1);
});
