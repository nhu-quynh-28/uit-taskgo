import { AppError } from "../utils/AppError.js";
import { sendError } from "../utils/response.js";

export function errorHandler(err, req, res, _next) {
  const log = req.log ?? console;

  if (err instanceof AppError) {
    if (!err.isOperational) {
      log.error({ err }, "Non-operational error");
    } else if (err.statusCode >= 500) {
      log.error({ err }, err.message);
    } else {
      log.warn({ err: { code: err.code, message: err.message } }, err.message);
    }

    return sendError(res, req, {
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return sendError(res, req, {
      statusCode: 401,
      code: "UNAUTHORIZED",
      message: "Invalid or expired token",
    });
  }

  if (err.name === "ValidationError" && err.errors) {
    const details = Object.values(err.errors).map((e) => ({
      path: e.path,
      message: e.message,
    }));
    return sendError(res, req, {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: err.message || "Validation failed",
      details,
    });
  }

  log.error({ err }, "Unhandled error");
  return sendError(res, req, {
    statusCode: 500,
    code: "INTERNAL_ERROR",
    message: "Internal server error",
  });
}
