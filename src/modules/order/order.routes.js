import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate } from "../../middlewares/validate.js";
import { requireRoles } from "../../middlewares/authorize.js";
import { idParamSchema } from "../../validations/common.schemas.js";
import { createOrderBodySchema, payOrderBodySchema } from "./order.schema.js";
import { createIdempotencyMiddleware } from "../../middlewares/idempotency.js";

export function createOrderRoutes(controller, idempotencyRepo) {
  const router = Router();
  const idempotent = createIdempotencyMiddleware(idempotencyRepo);

  router.post(
    "/",
    requireRoles("customer", "admin"),
    validate(createOrderBodySchema),
    asyncHandler(controller.create),
  );
  router.get("/", asyncHandler(controller.list));
  router.get(
    "/current-pending-payment",
    requireRoles("customer"),
    asyncHandler(controller.getCurrentPendingPayment),
  );
  router.get("/:id", validate(idParamSchema, "params"), asyncHandler(controller.getById));
  router.post(
    "/:id/publish",
    requireRoles("customer", "admin"),
    validate(idParamSchema, "params"),
    asyncHandler(controller.publish),
  );
  router.post(
    "/:id/accept",
    requireRoles("tasker"),
    validate(idParamSchema, "params"),
    idempotent,
    asyncHandler(controller.accept),
  );
  router.post(
    "/:id/arrive",
    requireRoles("tasker"),
    validate(idParamSchema, "params"),
    asyncHandler(controller.arrive),
  );
  router.post(
    "/:id/start",
    requireRoles("tasker"),
    validate(idParamSchema, "params"),
    asyncHandler(controller.start),
  );
  router.post(
    "/:id/complete",
    requireRoles("tasker", "admin"),
    validate(idParamSchema, "params"),
    asyncHandler(controller.complete),
  );
  router.post(
    "/:id/cancel",
    validate(idParamSchema, "params"),
    asyncHandler(controller.cancel),
  );
  router.post(
    "/:id/pay",
    requireRoles("customer", "admin"),
    validate(idParamSchema, "params"),
    validate(payOrderBodySchema),
    idempotent,
    asyncHandler(controller.pay),
  );

  return router;
}
