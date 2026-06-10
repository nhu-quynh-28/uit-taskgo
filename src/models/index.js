import { childLogger } from "../utils/logger.js";
import { User } from "./User.model.js";
import { Order } from "./Order.model.js";
import { ChatThread } from "./ChatThread.model.js";
import { ChatMessage } from "./ChatMessage.model.js";
import { Review } from "./Review.model.js";
import { Payment } from "./Payment.model.js";
import { PaymentTrace } from "./PaymentTrace.model.js";
import { EarningRecord } from "./EarningRecord.model.js";
import { Service } from "./Service.model.js";
import { Tasker } from "./Tasker.model.js";
import { Customer } from "./Customer.model.js";
import { Complaint } from "./Complaint.model.js";

const log = childLogger({ module: "models" });

/** All registered Mongoose models (Phase DB-2 — not wired to services yet). */
export const models = Object.freeze({
  User,
  Order,
  ChatThread,
  ChatMessage,
  Review,
  Payment,
  PaymentTrace,
  EarningRecord,
  Service,
  Tasker,
  Customer,
  Complaint,
});

export {
  User,
  Order,
  ChatThread,
  ChatMessage,
  Review,
  Payment,
  PaymentTrace,
  EarningRecord,
  Service,
  Tasker,
  Customer,
  Complaint,
};

/**
 * Register models and sync indexes after MongoDB connects.
 * Safe to call multiple times.
 */
export async function ensureMongoIndexes() {
  const entries = Object.entries(models);
  log.info({ collections: entries.map(([name]) => name) }, "Ensuring MongoDB indexes");

  await Promise.all(
    entries.map(async ([name, model]) => {
      await model.init();
      await model.ensureIndexes();
      log.info({ model: name }, "Indexes ensured");
    }),
  );
}

export * from "../schemas/serialization/lean.js";
export * from "../schemas/serialization/objectId.js";
