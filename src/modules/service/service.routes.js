import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate } from "../../middlewares/validate.js";
import { requireRoles } from "../../middlewares/authorize.js";
import { idParamSchema } from "../../validations/common.schemas.js";
import { createServiceBodySchema, updateServiceBodySchema } from "./service.schema.js";

export function createServiceRoutes(controller) {
  const router = Router();

  router.get("/", asyncHandler(controller.list));
  router.get("/:id", validate(idParamSchema, "params"), asyncHandler(controller.getById));
  router.post(
    "/",
    requireRoles("admin"),
    validate(createServiceBodySchema),
    asyncHandler(controller.create),
  );
  router.patch(
    "/:id",
    requireRoles("admin"),
    validate(idParamSchema, "params"),
    validate(updateServiceBodySchema),
    asyncHandler(controller.update),
  );
  router.delete(
    "/:id",
    requireRoles("admin"),
    validate(idParamSchema, "params"),
    asyncHandler(controller.remove),
  );

  return router;
}
