import { Router } from "express";
import { getMongoReadiness } from "../config/database.js";
import { sendSuccess } from "../utils/response.js";

export function createHealthRoutes() {
  const router = Router();

  router.get("/live", (req, res) => {
    return sendSuccess(res, req, { status: "alive" });
  });

  router.get("/ready", (req, res) => {
    const readiness = getMongoReadiness();

    if (readiness.status === "not_ready") {
      return res.status(503).json({
        success: false,
        data: readiness,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "MongoDB is not connected",
        },
        meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
      });
    }

    return sendSuccess(res, req, readiness);
  });

  return router;
}
