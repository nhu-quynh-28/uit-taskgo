import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate } from "../../middlewares/validate.js";
import { loginBodySchema, registerBodySchema } from "./auth.schema.js";

export function createAuthRoutes(controller) {
  const router = Router();
  router.post("/register", validate(registerBodySchema), asyncHandler(controller.register));
  router.post("/login", validate(loginBodySchema), asyncHandler(controller.login));
  return router;
}
