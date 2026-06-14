/**
 * Integration / performance Jest setup (backend in-memory by default).
 *
 * Required env (set in shell or .env.test):
 *   JWT_SECRET — min 16 chars (32+ recommended)
 *
 * Optional — MongoDB concurrency suite:
 *   REPOSITORY_DRIVER=mongo
 *   MONGODB_URI=mongodb://127.0.0.1:27017/taskgo_test
 *   RUN_MONGO_TESTS=true
 */
process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "test-jwt-secret-minimum-32-characters-long";
process.env.PAYOS_MOCK_FAIL_RATE = "0";
process.env.PAYOS_MOCK_FORCE_TIMEOUT = "false";
process.env.PAYOS_MOCK_FORCE_FAIL = "false";
process.env.PAYOS_MOCK_TIMEOUT_MS = process.env.PAYOS_MOCK_TIMEOUT_MS || "5000";

if (!process.env.REPOSITORY_DRIVER) {
  process.env.REPOSITORY_DRIVER = "inMemory";
}
