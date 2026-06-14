import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate } from "../../middlewares/validate.js";
import { requireRoles } from "../../middlewares/authorize.js";
import { idParamSchema } from "../../validations/common.schemas.js";
import { updateComplaintStatusBodySchema } from "./complaint.schema.js";

export function createComplaintRoutes(controller) {
  const router = Router();
  const adminOnly = requireRoles("admin");

  router.get("/", adminOnly, asyncHandler(controller.list));
  router.get("/:id", adminOnly, validate(idParamSchema, "params"), asyncHandler(controller.getById));
  router.patch(
    "/:id/status",
    adminOnly,
    validate(idParamSchema, "params"),
    validate(updateComplaintStatusBodySchema),
    asyncHandler(controller.updateStatus),
  );

  return router;
}
