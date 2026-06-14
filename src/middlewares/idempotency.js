import crypto from "crypto";
import { idempotencyKeyReused } from "../utils/AppError.js";
import { sendSuccess, sendError } from "../utils/response.js";

function hashBody(body) {
  return crypto.createHash("sha256").update(JSON.stringify(body ?? {})).digest("hex");
}

export function createIdempotencyMiddleware(idempotencyRepo) {
  return function idempotencyMiddleware(req, res, next) {
    const key = req.headers["idempotency-key"];
    if (!key || typeof key !== "string") {
      return next();
    }

    const route = `${req.method}:${req.baseUrl}${req.path}`;
    const userId = req.user?.id ?? "anonymous";
    const requestHash = hashBody(req.body);

    const existing = idempotencyRepo.findValid(key, route, userId);
    if (existing) {
      if (existing.requestHash !== requestHash) {
        return next(idempotencyKeyReused());
      }
      if (existing.statusCode >= 400) {
        return sendError(res, req, {
          statusCode: existing.statusCode,
          code: existing.body?.error?.code ?? "ERROR",
          message: existing.body?.error?.message ?? "Error",
          details: existing.body?.error?.details,
          data: existing.body?.data,
        });
      }
      return sendSuccess(res, req, existing.body?.data, existing.statusCode);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      idempotencyRepo.save({
        key,
        route,
        userId,
        requestHash,
        statusCode: res.statusCode,
        body,
      });
      return originalJson(body);
    };

    next();
  };
}
