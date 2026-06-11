import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate } from "../../middlewares/validate.js";
import Joi from "joi";
import { createThreadBodySchema, sendMessageBodySchema } from "./chat.schema.js";

const threadIdParam = Joi.object({
  threadId: Joi.string().trim().min(1).required(),
});

export function createChatRoutes(controller) {
  const router = Router();
  router.get("/threads", asyncHandler(controller.listThreads));
  router.post("/threads", validate(createThreadBodySchema), asyncHandler(controller.openThread));
  router.get(
    "/threads/:threadId/messages",
    validate(threadIdParam, "params"),
    asyncHandler(controller.getMessages),
  );
  router.post(
    "/threads/:threadId/messages",
    validate(threadIdParam, "params"),
    validate(sendMessageBodySchema),
    asyncHandler(controller.sendMessage),
  );
  router.post(
    "/threads/:threadId/read",
    validate(threadIdParam, "params"),
    asyncHandler(controller.markRead),
  );
  return router;
}
