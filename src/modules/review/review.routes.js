import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate } from "../../middlewares/validate.js";
import { createReviewBodySchema, taskerIdParamSchema } from "./review.schema.js";

export function createReviewRoutes(controller) {
  const router = Router();
  router.post("/", validate(createReviewBodySchema), asyncHandler(controller.create));
  router.get("/me", asyncHandler(controller.listMine));
  return router;
}

export function createPublicReviewRoutes(controller) {
  const router = Router();
  router.get(
    "/tasker/:taskerId",
    validate(taskerIdParamSchema, "params"),
    asyncHandler(controller.listTaskerReviews),
  );
  return router;
}
