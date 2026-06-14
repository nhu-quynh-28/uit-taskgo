import { childLogger } from "../../utils/logger.js";

const log = childLogger({ module: "mongoRepo" });

export function logMongoOp(repo, operation, meta = {}) {
  log.debug({ repo, operation, ...meta }, "MongoDB repository operation");
}

export function logMongoError(repo, operation, err, meta = {}) {
  log.error({ repo, operation, err, ...meta }, "MongoDB repository operation failed");
}
