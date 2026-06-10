import { newId } from "../utils/id.js";

export function correlationIdMiddleware(req, res, next) {
  const incoming = req.headers["x-request-id"];
  req.requestId = typeof incoming === "string" && incoming.trim() ? incoming.trim() : newId();
  res.setHeader("X-Request-Id", req.requestId);
  next();
}
