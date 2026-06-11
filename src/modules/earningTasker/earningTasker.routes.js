import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { requireRoles } from "../../middlewares/authorize.js";
import Joi from "joi";
import { validate } from "../../middlewares/validate.js";

const taskerIdParam = Joi.object({
  taskerId: Joi.string().trim().min(1).required(),
});

export function createEarningRoutes(controller) {
  const router = Router();
  router.get("/me", requireRoles("tasker"), asyncHandler(controller.getMyEarnings));
  router.get(
    "/tasker/:taskerId",
    requireRoles("admin"),
    validate(taskerIdParam, "params"),
    asyncHandler(controller.getTaskerEarnings),
  );
  return router;
}
