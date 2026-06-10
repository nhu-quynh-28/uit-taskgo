import mongoose from "mongoose";
import { logMongoError } from "./mongoLogger.js";

export function isDuplicateKeyError(err) {
  return err?.code === 11000 || err?.code === 11001;
}

/**
 * Run a callback inside a MongoDB transaction (requires replica set / Atlas).
 * Falls back to non-transactional execution when transactions are unavailable.
 */
export async function withTransaction(fn, { label = "transaction" } = {}) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } catch (err) {
    if (isTransactionNotSupported(err)) {
      logMongoError("session", label, err, { fallback: true });
      return fn(null);
    }
    throw err;
  } finally {
    session.endSession();
  }
}

function isTransactionNotSupported(err) {
  const msg = String(err?.message ?? "");
  return (
    msg.includes("Transaction numbers are only allowed") ||
    msg.includes("replica set") ||
    msg.includes("mongos") && msg.includes("multi-document transaction")
  );
}
