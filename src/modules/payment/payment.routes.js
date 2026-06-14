import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate } from "../../middlewares/validate.js";
import { requireRoles } from "../../middlewares/authorize.js";
import { orderIdParamSchema } from "../../validations/common.schemas.js";
import { createPayosPaymentBodySchema } from "./payos.schema.js";

export function createPaymentWebhookRoute(controller) {
  const router = Router();
  router.post("/webhook", asyncHandler(controller.webhook));
  return router;
}

export function createAuthenticatedPaymentRoutes(controller) {
  const router = Router();

  router.post(
    "/create",
    requireRoles("customer", "admin"),
    validate(createPayosPaymentBodySchema),
    asyncHandler(controller.create),
  );

  router.get(
    "/status/:orderId",
    requireRoles("customer", "admin"),
    validate(orderIdParamSchema, "params"),
    asyncHandler(controller.status),
  );

  return router;
}
