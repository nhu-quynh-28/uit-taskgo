const { appendTestRun } = require("../helpers/testResultsLogger.cjs");
const { main: generateAsrReport } = require("../scripts/generate-asr-report.cjs");

/**
 * Jest reporter — append kết quả mỗi lần chạy vào tests/results/test-runs.*
 */
class AppendResultsReporter {
  constructor(globalConfig, options = {}) {
    this.globalConfig = globalConfig;
    this.suiteName = options.suiteName || "jest";
    this._startMs = Date.now();
  }

  onRunComplete(_contexts, results) {
    const durationMs = Date.now() - this._startMs;
    const passed = results.numPassedTests ?? 0;
    const failed = results.numFailedTests ?? 0;
    const skipped = results.numPendingTests ?? 0;
    const total = results.numTotalTests ?? passed + failed + skipped;
    const failedSuitesCount = results.numFailedTestSuites ?? 0;
    const status = failed > 0 || failedSuitesCount > 0 ? "failed" : "passed";

    const failedSuites = (results.testResults || []).filter(
      (tr) => tr.numFailingTests > 0,
    );
    const failureLines = failedSuites.flatMap((tr) =>
      (tr.testResults || [])
        .filter((t) => t.status === "failed")
        .map((t) => `${tr.testFilePath}: ${t.fullName}`),
    );

    const { logFile } = appendTestRun({
      suite: this.suiteName,
      status,
      passed,
      failed,
      skipped,
      total,
      durationMs,
      exitCode: status === "passed" ? 0 : 1,
      message:
        failureLines.length > 0
          ? `${failureLines.length} failing test(s)`
          : null,
      details:
        failureLines.length > 0
          ? { failures: failureLines.slice(0, 20) }
          : { testSuites: results.numTotalTestSuites },
    });

    // Gợi ý đường dẫn file sau mỗi lần chạy
    console.log(`\n[test-results] Appended run → ${logFile}\n`);

    try {
      generateAsrReport();
    } catch (err) {
      console.warn("[asr-report] Failed to generate report:", err.message);
    }
  }
}

module.exports = AppendResultsReporter;
