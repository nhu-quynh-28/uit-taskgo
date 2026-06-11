import { sendSuccess } from "../../utils/response.js";
import { logger } from "../../utils/logger.js";

export function createPaymentController(payosGateway) {
  return {
    async create(req, res) {
      const paymentLink = await payosGateway.createCheckoutLink(req.body, req.user);
      return sendSuccess(res, req, paymentLink, 201);
    },

    async webhook(req, res) {
      try {
        await payosGateway.handleWebhook(req.body);
        return res.status(200).json({ success: true });
      } catch (err) {
        logger.warn(
          { err, requestId: req.requestId },
          "payOS webhook processing failed",
        );
        const statusCode = err.statusCode === 404 ? 404 : 400;
        return res.status(statusCode).json({
          success: false,
          message: err.message ?? "Webhook processing failed",
        });
      }
    },

    async status(req, res) {
      const data = await payosGateway.getPaymentStatus(req.params.orderId, req.user);
      return sendSuccess(res, req, data);
    },
  };
}
