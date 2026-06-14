import mongoose from "mongoose";
import { childLogger } from "../utils/logger.js";
import { migration001EnsureIndexes } from "./migrations/001_ensure_indexes.migration.js";

const log = childLogger({ module: "migrations" });

const MIGRATION_COLLECTION = "schema_migrations";

/** @type {import('./types.js').Migration[]} */
const MIGRATIONS = [migration001EnsureIndexes];

function getMigrationCollection() {
  return mongoose.connection.db.collection(MIGRATION_COLLECTION);
}

export async function getAppliedMigrationNames() {
  const col = getMigrationCollection();
  const docs = await col.find({}).sort({ name: 1 }).toArray();
  return docs.map((d) => d.name);
}

export async function getMigrationStatus() {
  const applied = await getAppliedMigrationNames();
  return MIGRATIONS.map((m) => ({
    name: m.name,
    description: m.description,
    applied: applied.includes(m.name),
  }));
}

/**
 * Apply pending migrations in order.
 * @param {{ dryRun?: boolean }} options
 */
export async function runMigrations(options = {}) {
  const dryRun = options.dryRun ?? false;
  const applied = new Set(await getAppliedMigrationNames());
  const pending = MIGRATIONS.filter((m) => !applied.has(m.name));

  if (pending.length === 0) {
    log.info("No pending migrations");
    return { applied: [], pending: [] };
  }

  if (dryRun) {
    log.info({ pending: pending.map((m) => m.name) }, "Dry run — migrations not applied");
    return { applied: [], pending: pending.map((m) => m.name), dryRun: true };
  }

  const col = getMigrationCollection();
  const appliedNow = [];

  for (const migration of pending) {
    log.info({ name: migration.name }, "Applying migration");
    const startedAt = new Date();

    await migration.up({ log, connection: mongoose.connection });

    await col.updateOne(
      { name: migration.name },
      {
        $set: {
          name: migration.name,
          description: migration.description,
          appliedAt: startedAt,
        },
      },
      { upsert: true },
    );

    appliedNow.push(migration.name);
    log.info({ name: migration.name }, "Migration applied");
  }

  return { applied: appliedNow, pending: [] };
}

/**
 * Roll back the last applied migration (if `down` is implemented).
 */
export async function rollbackLastMigration() {
  const applied = await getAppliedMigrationNames();
  if (applied.length === 0) {
    log.info("No migrations to roll back");
    return { rolledBack: null };
  }

  const lastName = applied[applied.length - 1];
  const migration = MIGRATIONS.find((m) => m.name === lastName);
  if (!migration?.down) {
    throw new Error(`Migration ${lastName} does not support rollback`);
  }

  log.info({ name: lastName }, "Rolling back migration");
  await migration.down({ log, connection: mongoose.connection });
  await getMigrationCollection().deleteOne({ name: lastName });

  return { rolledBack: lastName };
}
