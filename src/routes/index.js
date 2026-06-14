import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { swaggerSpec } from "../config/swagger.js";
import { createAuthenticateMiddleware } from "../middlewares/authenticate.js";
import { createAuthRoutes } from "../modules/auth/auth.routes.js";
import { createUserRoutes } from "../modules/user/user.routes.js";
import { createOrderRoutes } from "../modules/order/order.routes.js";
import { createEarningRoutes } from "../modules/earningTasker/earningTasker.routes.js";
import { createChatRoutes } from "../modules/chat/chat.routes.js";
import {
  createPublicReviewRoutes,
  createReviewRoutes,
} from "../modules/review/review.routes.js";
import { createHealthRoutes } from "../health/health.routes.js";
import { sendSuccess } from "../utils/response.js";
import { requireRoles } from "../middlewares/authorize.js";
import { createServiceRoutes } from "../modules/service/service.routes.js";
import { createComplaintRoutes } from "../modules/complaint/complaint.routes.js";
import { createAdminRoutes } from "../modules/admin/admin.routes.js";
import { createTaskerModerationRoutes } from "../modules/tasker/tasker.routes.js";
import {
  createAuthenticatedPaymentRoutes,
  createPaymentWebhookRoute,
} from "../modules/payment/payment.routes.js";

export function createApiRouter(container) {
  const api = Router();
  const { controllers, repos, services } = container;
  const authenticate = createAuthenticateMiddleware(services.auth.getUserById);

  api.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  api.use("/health", createHealthRoutes());

  api.get("/health", (req, res) => {
    return sendSuccess(res, req, {
      service: "taskgo-api",
      status: "ok",
    });
  });

  api.use("/auth", createAuthRoutes(controllers.auth));
  api.use("/reviews", createPublicReviewRoutes(controllers.review));
  api.use("/payment", createPaymentWebhookRoute(controllers.payment));
  api.use(authenticate);
  api.use("/users", createUserRoutes(controllers.user));
  api.use("/taskers", createTaskerModerationRoutes(controllers.tasker));
  api.use("/orders", createOrderRoutes(controllers.order, repos.idempotency));
  api.use("/payment", createAuthenticatedPaymentRoutes(controllers.payment));
  api.use("/services", createServiceRoutes(controllers.service));
  api.use("/complaints", createComplaintRoutes(controllers.complaint));
  api.use("/admin", requireRoles("admin"), createAdminRoutes(controllers.admin));
  api.get("/analytics/dashboard", requireRoles("admin"), asyncHandler(controllers.admin.dashboard));
  api.use("/earnings", createEarningRoutes(controllers.earning));
  api.use("/chat", createChatRoutes(controllers.chat));
  api.use("/reviews", createReviewRoutes(controllers.review));

  return api;
}
