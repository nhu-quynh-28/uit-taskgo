/**
 * Lưu metric ASR từng kịch bản — dùng để sinh tests/reports/asr_report.md
 */
const fs = require("fs");
const path = require("path");

const RESULTS_DIR = path.join(__dirname, "..", "results");
const METRICS_FILE = path.join(RESULTS_DIR, "asr-metrics.jsonl");

/** @type {Record<string, { label: string; attribute: string }>} */
const SCENARIO_REGISTRY = {
  "perf.api.response": { attribute: "performance", label: "API Response Time" },
  "perf.socket.latency": { attribute: "performance", label: "Socket notification latency" },
  "sec.auth.jwt": { attribute: "security", label: "Authentication & Authorization" },
  "sec.pricing.integrity": { attribute: "security", label: "Pricing Data Integrity" },
  "sec.concurrency.accept": { attribute: "security", label: "Data Integrity under Concurrency" },
  "ux.accept.doubleClick": { attribute: "usability", label: "Double-click guard" },
  "avail.payment.timeout": { attribute: "availability", label: "PayOS graceful degradation" },
  "avail.socket.reconnect": { attribute: "availability", label: "Socket Reconnection Recovery" },
  "maint.earning.isolation": { attribute: "maintainability", label: "Earning module isolation" },
};

function ensureDir() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

/**
 * @param {{
 *   id: string;
 *   status: "passed" | "failed";
 *   metrics?: Record<string, number | string | boolean | null>;
 *   message?: string;
 *   suite?: string;
 * }} entry
 */
function recordAsrScenario(entry) {
  ensureDir();
  const timestamp = new Date().toISOString();
  const record = {
    timestamp,
    id: entry.id,
    status: entry.status,
    metrics: entry.metrics ?? {},
    message: entry.message ?? null,
    suite: entry.suite ?? null,
  };
  fs.appendFileSync(METRICS_FILE, `${JSON.stringify(record)}\n`, "utf8");
  return record;
}

function readAllScenarios() {
  if (!fs.existsSync(METRICS_FILE)) return [];
  const lines = fs.readFileSync(METRICS_FILE, "utf8").trim().split("\n").filter(Boolean);
  return lines.map((line) => JSON.parse(line));
}

/** Latest record per scenario id (newest timestamp wins). */
function getLatestByScenario() {
  const all = readAllScenarios();
  const map = new Map();
  for (const row of all) {
    const prev = map.get(row.id);
    if (!prev || row.timestamp > prev.timestamp) {
      map.set(row.id, row);
    }
  }
  return map;
}

/** Latest PASSED record per scenario id. */
function getLatestPassedByScenario() {
  const map = new Map();
  for (const row of readAllScenarios()) {
    if (row.status !== "passed") continue;
    const prev = map.get(row.id);
    if (!prev || row.timestamp > prev.timestamp) {
      map.set(row.id, row);
    }
  }
  return map;
}

function getScenario(id) {
  return getLatestPassedByScenario().get(id) ?? getLatestByScenario().get(id) ?? null;
}

function numMetric(scenario, key, fallback = null) {
  if (!scenario?.metrics) return fallback;
  const v = scenario.metrics[key];
  if (v == null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : fallback;
}

module.exports = {
  recordAsrScenario,
  readAllScenarios,
  getLatestByScenario,
  getLatestPassedByScenario,
  getScenario,
  numMetric,
  METRICS_FILE,
  SCENARIO_REGISTRY,
};
