import { getRepositories } from "./config/database.js";
import { createEventBus } from "./events/eventBus.js";
import { createAuthService } from "./modules/auth/auth.service.js";
import { createUserService } from "./modules/user/user.service.js";
import { createEarningTaskerService } from "./modules/earningTasker/earningTasker.service.js";
import { createPaymentService } from "./modules/payment/payment.service.js";
import { createPayosGatewayService } from "./modules/payment/payos.gateway.service.js";
import { createPaymentController } from "./modules/payment/payment.controller.js";
import { createOrderService } from "./modules/order/order.service.js";
import { createChatService } from "./modules/chat/chat.service.js";
import { createAuthController } from "./modules/auth/auth.controller.js";
import { createUserController } from "./modules/user/user.controller.js";
import { createOrderController } from "./modules/order/order.controller.js";
import { createEarningController } from "./modules/earningTasker/earningTasker.controller.js";
import { createChatController } from "./modules/chat/chat.controller.js";
import { createReviewService } from "./modules/review/review.service.js";
import { createReviewController } from "./modules/review/review.controller.js";
import { registerHandlers } from "./events/registerHandlers.js";
import { createServiceService } from "./modules/service/service.service.js";
import { createComplaintService } from "./modules/complaint/complaint.service.js";
import { createAdminService } from "./modules/admin/admin.service.js";
import { createServiceController } from "./modules/service/service.controller.js";
import { createComplaintController } from "./modules/complaint/complaint.controller.js";
import { createAdminController } from "./modules/admin/admin.controller.js";
import { createTaskerController } from "./modules/tasker/tasker.controller.js";

export function createContainer() {
  const repos = getRepositories();
  const eventBus = createEventBus();

  const authService = createAuthService({ userRepo: repos.user });
  const userService = createUserService({ userRepo: repos.user, orderRepo: repos.order });
  const earningService = createEarningTaskerService({ earningRepo: repos.earning });
  const paymentService = createPaymentService({
    paymentRepo: repos.payment,
    orderRepo: repos.order,
    eventBus,
    userService,
  });
  const payosGateway = createPayosGatewayService({
    orderRepo: repos.order,
    paymentService,
  });
  const serviceCatalog = createServiceService({ serviceRepo: repos.service });
  const orderService = createOrderService({
    orderRepo: repos.order,
    userService,
    eventBus,
    paymentService,
    earningService,
    serviceCatalog,
  });
  const complaintService = createComplaintService({
    complaintRepo: repos.complaint,
    userRepo: repos.user,
  });
  const adminService = createAdminService({
    userRepo: repos.user,
    orderRepo: repos.order,
    serviceRepo: repos.service,
    paymentRepo: repos.payment,
  });
  const chatService = createChatService({
    chatRepo: repos.chat,
    orderRepo: repos.order,
    userRepo: repos.user,
    eventBus,
  });
  const reviewService = createReviewService({
    reviewRepo: repos.review,
    orderRepo: repos.order,
    userRepo: repos.user,
    eventBus,
  });

  const services = {
    auth: authService,
    user: userService,
    order: orderService,
    payment: paymentService,
    payos: payosGateway,
    earning: earningService,
    chat: chatService,
    review: reviewService,
    service: serviceCatalog,
    complaint: complaintService,
    admin: adminService,
  };

  const controllers = {
    auth: createAuthController(authService),
    user: createUserController(userService),
    order: createOrderController(orderService),
    earning: createEarningController(earningService),
    chat: createChatController(chatService),
    review: createReviewController(reviewService),
    service: createServiceController(serviceCatalog),
    complaint: createComplaintController(complaintService),
    admin: createAdminController(adminService),
    tasker: createTaskerController(userService),
    payment: createPaymentController(payosGateway),
  };

  return {
    repos,
    eventBus,
    services,
    controllers,
    registerEventHandlers: (io) =>
      registerHandlers(eventBus, { io, repos, userService: services.user }),
  };
}
