import { createApp } from "../../backend/src/app.js";
import { resetRepositoriesForTests } from "../../backend/src/config/database.js";

/**
 * Fresh Express app + seeded in-memory (or mongo) repositories per test file.
 */
export async function getTestApp() {
  await resetRepositoriesForTests();
  const { app } = createApp();
  return app;
}
