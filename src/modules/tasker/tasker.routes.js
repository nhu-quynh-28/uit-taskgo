import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate } from "../../middlewares/validate.js";
import { requireRoles } from "../../middlewares/authorize.js";
import { idParamSchema } from "../../validations/common.schemas.js";

export function createTaskerModerationRoutes(controller) {
  const router = Router();
  const adminOnly = requireRoles("admin");

  router.patch(
    "/:id/verify",
    adminOnly,
    validate(idParamSchema, "params"),
    asyncHandler(controller.verify),
  );
  router.patch(
    "/:id/reject",
    adminOnly,
    validate(idParamSchema, "params"),
    asyncHandler(controller.reject),
  );
  router.patch(
    "/:id/block",
    adminOnly,
    validate(idParamSchema, "params"),
    asyncHandler(controller.block),
  );
  router.patch(
    "/:id/unblock",
    adminOnly,
    validate(idParamSchema, "params"),
    asyncHandler(controller.unblock),
  );

  return router;
}
