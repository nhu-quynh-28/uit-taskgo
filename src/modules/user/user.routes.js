import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate } from "../../middlewares/validate.js";
import { requireRoles } from "../../middlewares/authorize.js";
import { idParamSchema } from "../../validations/common.schemas.js";
import {
  listTaskersQuerySchema,
  submitKycSchema,
  updateProfileBodySchema,
} from "./user.schema.js";

export function createUserRoutes(controller) {
  const router = Router();
  router.get("/me", asyncHandler(controller.getMe));
  router.patch("/me", validate(updateProfileBodySchema), asyncHandler(controller.updateMe));
  router.post(
    "/me/kyc",
    requireRoles("tasker"),
    validate(submitKycSchema),
    asyncHandler(controller.submitKyc),
  );
  router.get(
    "/taskers",
    validate(listTaskersQuerySchema, "query"),
    asyncHandler(controller.listTaskers),
  );
  router.patch(
    "/:id/block",
    requireRoles("admin"),
    validate(idParamSchema, "params"),
    asyncHandler(controller.blockUser),
  );
  router.patch(
    "/:id/unblock",
    requireRoles("admin"),
    validate(idParamSchema, "params"),
    asyncHandler(controller.unblockUser),
  );
  router.get("/:id", validate(idParamSchema, "params"), asyncHandler(controller.getUserById));
  router.patch(
    "/:id",
    requireRoles("admin"),
    validate(idParamSchema, "params"),
    validate(updateProfileBodySchema),
    asyncHandler(controller.updateUserById),
  );
  return router;
}
