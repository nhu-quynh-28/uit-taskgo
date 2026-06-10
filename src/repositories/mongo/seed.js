import { runSeed } from "../../seed/runner.js";

/**
 * Seed MongoDB on API startup when the database is empty (core accounts + pending order).
 */
export async function seedMongoIfEmpty() {
  return runSeed({ scope: "core", ifEmpty: true });
}
