import pino from "pino";
import { env } from "../config/env.js";

export const logger = pino({
  level: env.nodeEnv === "production" ? "info" : "debug",
  transport:
    env.nodeEnv === "development"
      ? { target: "pino/file", options: { destination: 1 } }
      : undefined,
});

export function childLogger(bindings) {
  return logger.child(bindings);
}
