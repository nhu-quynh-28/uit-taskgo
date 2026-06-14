import { sendSuccess, sendCreated } from "../../utils/response.js";
import { sendPaymentFailed } from "../../utils/response.js";

export function createOrderController(orderService) {
  const correlation = (req) => req.requestId;

  return {
    async create(req, res) {
      const order = await orderService.createOrder(req.user, req.body);
      return sendCreated(res, req, order);
    },
    async list(req, res) {
      return sendSuccess(res, req, await orderService.listOrders(req.user, req.query));
    },
    async getById(req, res) {
      return sendSuccess(res, req, await orderService.getOrder(req.params.id, req.user));
    },
    async getCurrentPendingPayment(req, res) {
      return sendSuccess(res, req, await orderService.getCurrentPendingPaymentOrder(req.user));
    },
    async publish(req, res) {
      const result = await orderService.publishOrder(req.user, req.params.id, correlation(req));
      return sendSuccess(res, req, result);
    },
    async accept(req, res) {
      const order = await orderService.acceptOrder(req.user, req.params.id, correlation(req));
      return sendSuccess(res, req, order);
    },
    async arrive(req, res) {
      const order = await orderService.arriveOrder(req.user, req.params.id, correlation(req));
      return sendSuccess(res, req, order);
    },
    async start(req, res) {
      const order = await orderService.startOrder(req.user, req.params.id, correlation(req));
      return sendSuccess(res, req, order);
    },
    async complete(req, res) {
      const result = await orderService.completeOrder(req.user, req.params.id, correlation(req));
      return sendSuccess(res, req, result);
    },
    async cancel(req, res) {
      const order = await orderService.cancelOrder(req.user, req.params.id, correlation(req));
      return sendSuccess(res, req, order);
    },
    async pay(req, res) {
      const result = await orderService.payOrder(req.user, req.params.id, {
        forceFail: req.body.simulateFail,
        forceTimeout: req.body.simulateTimeout,
        correlationId: correlation(req),
      });
      if (result.success) {
        return sendSuccess(res, req, result);
      }
      return sendPaymentFailed(res, req, {
        message: result.message,
        order: result.order,
        trace: result.trace,
        retryable: result.retryable,
      });
    },
  };
}
