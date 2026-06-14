#!/usr/bin/env node
/**
 * ASR Performance — Socket.IO `new_job_available` dispatch < 1000ms to 5 taskers.
 *
 * Run: node tests/performance/socket-latency.js
 * Env: JWT_SECRET, REPOSITORY_DRIVER=inMemory (default).
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
process.env.NEARBY_TASKER_RADIUS_KM = process.env.NEARBY_TASKER_RADIUS_KM || "50";

const { io: ioClient } = await import("socket.io-client");
const request = (await import("supertest")).default;
const { startTestServer, stopTestServer } = await import("../helpers/testServer.js");
const { login } = await import("../helpers/auth.js");
const { SERVICE_IDS } = await import("../../backend/seed/constants.js");

const MAX_LATENCY_MS = 1000;
const TASKER_EMAILS = [
  "tasker1@taskgo.app",
  "tasker2@taskgo.app",
  "tasker4@taskgo.app",
  "tasker5@taskgo.app",
  "tasker6@taskgo.app",
];

const ORDER_LOCATION = { lat: 37.7765, lng: -122.4168 };

function connectTasker(baseUrl, token) {
  return new Promise((resolve, reject) => {
    const socket = ioClient(baseUrl, {
      auth: { token },
      transports: ["websocket"],
      forceNew: true,
    });
    socket.on("connect", () => resolve(socket));
    socket.on("connect_error", (err) => reject(err));
  });
}

function registerSession(socket, userId) {
  return new Promise((resolve) => {
    socket.emit("register_session", { userId }, (ack) => resolve(ack));
  });
}

function toggleOnline(socket, userId) {
  return new Promise((resolve) => {
    socket.emit("toggle_online", { userId, isOnline: true }, (ack) => resolve(ack));
  });
}

function updateLocation(socket, userId, lng, lat) {
  return new Promise((resolve) => {
    socket.emit("update_location", { userId, lng, lat }, (ack) => resolve(ack));
  });
}

function waitForNewJob(socket, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout waiting for new_job_available")), timeoutMs);
    socket.once("new_job_available", (payload) => {
      clearTimeout(timer);
      resolve({ socket, payload, receivedAt: performance.now() });
    });
  });
}

async function patchTaskerServices(app, token) {
  await request(app)
    .patch("/api/users/me")
    .set("Authorization", `Bearer ${token}`)
    .send({ services: [SERVICE_IDS.deepCleaning] });
}

async function main() {
  const startedAt = performance.now();
  const { app, server, io, baseUrl, container } = await startTestServer();

  const customerToken = await login(app, "customer@taskgo.app");
  const taskerTokens = [];
  for (const email of TASKER_EMAILS) {
    const token = await login(app, email);
    await patchTaskerServices(app, token);
    taskerTokens.push({ email, token });
  }

  const sockets = [];
  const listeners = [];

  try {
    for (const { email, token } of taskerTokens) {
      const socket = await connectTasker(baseUrl, token);
      const me = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${token}`);
      const userId = me.body.data.id;

      await registerSession(socket, userId);
      await toggleOnline(socket, userId);
      await updateLocation(socket, userId, ORDER_LOCATION.lng, ORDER_LOCATION.lat);

      listeners.push(waitForNewJob(socket, MAX_LATENCY_MS + 2000));
      sockets.push({ socket, email, userId });
    }

    const dispatchStart = performance.now();

    const create = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        serviceName: "Deep Home Cleaning",
        serviceId: SERVICE_IDS.deepCleaning,
        address: "500 Market St, Floor 12",
        scheduledAt: "2026-09-01T14:00:00.000Z",
        location: ORDER_LOCATION,
      });

    if (create.status !== 201) {
      throw new Error(`Order create failed: ${create.status} ${JSON.stringify(create.body)}`);
    }

    const orderId = create.body.data.id;
    const results = await Promise.all(listeners);

    const latencies = results.map((r) => r.receivedAt - dispatchStart);
    const maxLatency = Math.max(...latencies);

    console.log("--- TaskGo socket-latency ---");
    console.log(`Order ${orderId} created; events received by ${results.length} taskers`);
    for (let i = 0; i < results.length; i += 1) {
      console.log(
        `  ${sockets[i].email}: ${latencies[i].toFixed(1)}ms (order ${results[i].payload.order?.id})`,
      );
    }
    console.log(`Max latency: ${maxLatency.toFixed(1)}ms (budget < ${MAX_LATENCY_MS}ms)`);

    const failed = maxLatency >= MAX_LATENCY_MS;
    if (failed) {
      console.error("FAIL: socket dispatch exceeded 1s budget");
    } else {
      console.log("PASS: all taskers notified within 1s.");
    }

    const { logFile } = appendTestRun({
      suite: "performance:socket",
      status: failed ? "failed" : "passed",
      passed: failed ? 0 : 1,
      failed: failed ? 1 : 0,
      total: 1,
      durationMs: performance.now() - startedAt,
      message: failed ? "Socket latency exceeded 1s" : "All taskers notified within 1s",
      details: {
        maxLatencyMs: maxLatency,
        budgetMs: MAX_LATENCY_MS,
        taskerCount: results.length,
        latenciesByEmail: sockets.map((s, i) => ({
          email: s.email,
          ms: latencies[i],
        })),
      },
    });
    recordAsrScenario({
      id: "perf.socket.latency",
      status: failed ? "failed" : "passed",
      suite: "performance:socket",
      metrics: { maxLatencyMs: Math.round(maxLatency * 10) / 10 },
    });
    console.log(`[test-results] Appended run → ${logFile}`);

    const { main: generateAsrReport } = require("../scripts/generate-asr-report.cjs");
    generateAsrReport();

    process.exit(failed ? 1 : 0);
  } finally {
    for (const { socket } of sockets) socket.close();
    await stopTestServer(server, io);
  }
}

main().catch((err) => {
  appendTestRun({
    suite: "performance:socket",
    status: "failed",
    failed: 1,
    total: 1,
    message: err?.message ?? String(err),
  });
  console.error(err);
  process.exit(1);
});
