/** @type {import('jest').Config} */
export default {
  displayName: "integration",
  testEnvironment: "node",
  transform: {},
  testMatch: ["<rootDir>/integration/**/*.test.js"],
  setupFiles: ["<rootDir>/setup.integration.js"],
  testTimeout: Number(process.env.PAYOS_MOCK_TIMEOUT_MS || 5000) + 8000,
  verbose: true,
  reporters: [
    "default",
    ["<rootDir>/reporters/appendResultsReporter.cjs", { suiteName: "integration" }],
  ],
};
