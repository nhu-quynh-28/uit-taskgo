import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { requireRoles } from "../../middlewares/authorize.js";

export function createAdminRoutes(controller) {
  const router = Router();
  router.get("/dashboard", asyncHandler(controller.dashboard));
  return router;
}
