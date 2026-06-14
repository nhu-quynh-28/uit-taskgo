import { ensureMongoIndexes } from "../../models/index.js";

/** @type {import('../types.js').Migration} */
export const migration001EnsureIndexes = {
  name: "001_ensure_indexes",
  description: "Sync all Mongoose collection indexes (users, orders, chat, reviews, payments, earnings)",
  async up({ log }) {
    log.info("Ensuring MongoDB indexes from schema definitions");
    await ensureMongoIndexes();
  },
  async down({ log }) {
    log.warn(
      "Index migration rollback is a no-op — dropping indexes automatically is unsafe in production",
    );
  },
};
