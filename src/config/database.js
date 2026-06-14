import mongoose from "mongoose";
import { childLogger } from "../utils/logger.js";
import { env } from "./env.js";

export { getRepositories, resetRepositoriesForTests } from "./repositories.js";

const log = childLogger({ module: "database" });

/** @type {"not_configured" | "disconnected" | "connecting" | "connected" | "disconnecting" | "failed"} */
let mongoState = "not_configured";
let listenersAttached = false;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveMongoStateFromMongoose() {
  const readyState = mongoose.connection.readyState;
  switch (readyState) {
    case 0:
      return "disconnected";
    case 1:
      return "connected";
    case 2:
      return "connecting";
    case 3:
      return "disconnecting";
    default:
      return "disconnected";
  }
}

export function getMongoState() {
  if (!env.mongodbUri) return "not_configured";
  if (mongoState === "not_configured") return resolveMongoStateFromMongoose();
  return mongoState;
}

export function isMongoConnected() {
  return getMongoState() === "connected";
}

/**
 * Readiness payload for GET /api/health/ready
 */
export function getMongoReadiness() {
  const state = getMongoState();

  if (state === "not_configured") {
    return {
      status: "ready",
      driver: "inMemory",
      mongo: "not_configured",
    };
  }

  if (state === "connected") {
    return {
      status: "ready",
      driver: "mongodb",
      mongo: "connected",
    };
  }

  return {
    status: "not_ready",
    driver: "mongodb",
    mongo: state === "failed" ? "failed" : "disconnected",
  };
}

function attachConnectionListeners() {
  const conn = mongoose.connection;

  conn.on("connected", () => {
    mongoState = "connected";
    log.info({ host: conn.host, name: conn.name }, "MongoDB connected");
  });

  conn.on("disconnected", () => {
    if (mongoState !== "disconnecting") {
      mongoState = "disconnected";
    }
    log.warn("MongoDB disconnected");
  });

  conn.on("reconnected", () => {
    mongoState = "connected";
    log.info("MongoDB reconnected");
  });

  conn.on("error", (err) => {
    mongoState = "failed";
    log.error({ err }, "MongoDB connection error");
  });
}

/**
 * Connect to MongoDB with retries. No-op when MONGODB_URI is unset.
 */
export async function connectMongo() {
  if (!env.mongodbUri) {
    mongoState = "not_configured";
    log.info("MONGODB_URI not set — skipping MongoDB connection (in-memory repositories active)");
    return { connected: false, skipped: true };
  }

  if (mongoose.connection.readyState === 1) {
    mongoState = "connected";
    return { connected: true, skipped: false };
  }

  if (!listenersAttached) {
    attachConnectionListeners();
    listenersAttached = true;
  }

  const options = {
    ...env.mongoOptions,
    serverSelectionTimeoutMS: env.mongoServerSelectionTimeoutMs,
  };

  let lastError;

  for (let attempt = 1; attempt <= env.mongoMaxRetryAttempts; attempt += 1) {
    mongoState = "connecting";
    log.info(
      { attempt, maxAttempts: env.mongoMaxRetryAttempts },
      "Connecting to MongoDB",
    );

    try {
      await mongoose.connect(env.mongodbUri, options);
      mongoState = "connected";
      log.info(
        {
          host: mongoose.connection.host,
          db: mongoose.connection.name,
        },
        "MongoDB connection established",
      );

      try {
        const { ensureMongoIndexes } = await import("../models/index.js");
        await ensureMongoIndexes();
      } catch (indexErr) {
        log.warn({ err: indexErr }, "MongoDB index sync failed (models may be unavailable)");
      }

      return { connected: true, skipped: false };
    } catch (err) {
      lastError = err;
      mongoState = "failed";
      log.warn(
        { err, attempt, maxAttempts: env.mongoMaxRetryAttempts },
        "MongoDB connection attempt failed",
      );

      if (attempt < env.mongoMaxRetryAttempts) {
        const delay = env.mongoRetryDelayMs * attempt;
        log.info({ delayMs: delay }, "Retrying MongoDB connection");
        await sleep(delay);
      }
    }
  }

  log.error({ err: lastError }, "MongoDB connection failed after all retries");
  throw lastError;
}

/**
 * Gracefully close the MongoDB connection.
 */
export async function disconnectMongo() {
  if (!env.mongodbUri) {
    return;
  }

  if (mongoose.connection.readyState === 0) {
    mongoState = "disconnected";
    return;
  }

  mongoState = "disconnecting";
  log.info("Closing MongoDB connection");

  try {
    await mongoose.disconnect();
    mongoState = "disconnected";
    log.info("MongoDB connection closed");
  } catch (err) {
    mongoState = "failed";
    log.error({ err }, "Error while disconnecting MongoDB");
    throw err;
  }
}
