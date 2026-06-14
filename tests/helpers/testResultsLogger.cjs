/**
 * Ghi thêm kết quả mỗi lần chạy vào tests/results/test-runs.log (đọc được)
 * và tests/results/test-runs.jsonl (một dòng JSON / lần chạy).
 */
const fs = require("fs");
const path = require("path");

const RESULTS_DIR = path.join(__dirname, "..", "results");
const LOG_FILE = path.join(RESULTS_DIR, "test-runs.log");
const JSONL_FILE = path.join(RESULTS_DIR, "test-runs.jsonl");

function ensureResultsDir() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

/**
 * @param {{
 *   suite: string;
 *   status: "passed" | "failed" | "skipped";
 *   passed?: number;
 *   failed?: number;
 *   skipped?: number;
 *   total?: number;
 *   durationMs?: number;
 *   exitCode?: number;
 *   message?: string;
 *   details?: Record<string, unknown>;
 * }} entry
 */
function appendTestRun(entry) {
  ensureResultsDir();

  const timestamp = new Date().toISOString();
  const record = {
    timestamp,
    suite: entry.suite,
    status: entry.status,
    passed: entry.passed ?? 0,
    failed: entry.failed ?? 0,
    skipped: entry.skipped ?? 0,
    total: entry.total ?? (entry.passed ?? 0) + (entry.failed ?? 0) + (entry.skipped ?? 0),
    durationMs: entry.durationMs ?? null,
    exitCode: entry.exitCode ?? (entry.status === "passed" ? 0 : 1),
    message: entry.message ?? null,
    details: entry.details ?? null,
  };

  fs.appendFileSync(JSONL_FILE, `${JSON.stringify(record)}\n`, "utf8");

  const duration =
    record.durationMs != null ? `${(record.durationMs / 1000).toFixed(2)}s` : "n/a";
  const counts = `${record.passed} passed, ${record.failed} failed, ${record.skipped} skipped (${record.total} total)`;
  const statusLabel = record.status.toUpperCase();

  const block = [
    "",
    "=".repeat(80),
    `[${timestamp}] ${record.suite} — ${statusLabel} (${counts}, ${duration})`,
    record.message ? `  message: ${record.message}` : null,
    record.details ? `  details: ${JSON.stringify(record.details)}` : null,
    "=".repeat(80),
  ]
    .filter(Boolean)
    .join("\n");

  fs.appendFileSync(LOG_FILE, `${block}\n`, "utf8");

  return { logFile: LOG_FILE, jsonlFile: JSONL_FILE, record };
}

module.exports = { appendTestRun, LOG_FILE, JSONL_FILE, RESULTS_DIR };
