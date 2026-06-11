import { env } from "../../config/env.js";
import {
  createPaymentLink,
  getPayOSClient,
  verifyPaymentWebhookData,
} from "../../config/payos.js";
import { PAYMENT_STATUS } from "../../config/constants.js";
import { badRequest, notFound } from "../../utils/AppError.js";
import { logger } from "../../utils/logger.js";
import {
  allocateUniquePayosOrderCode,
  formatPayosDescription,
} from "../../utils/payosOrderCode.js";
import { toOrderDTO } from "../order/order.dto.js";
import { getOrderChargeTotal } from "../../config/pricing.js";

function appendOrderIdQuery(baseUrl, orderId) {
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}orderId=${encodeURIComponent(orderId)}`;
}

export function createPayosGatewayService({ orderRepo, paymentService }) {
  function assertOrderPaymentAccess(order, actor) {
    if (!actor) {
      throw badRequest("Authentication required");
    }
    if (order.customerId !== actor.id && actor.role !== "admin") {
      throw badRequest("Not authorized to access payment for this order");
    }
  }

  function assertCanPayForOrder(order, actor) {
    assertOrderPaymentAccess(order, actor);
    if (order.paymentStatus === PAYMENT_STATUS.PAID) {
      throw badRequest("Order is already paid");
    }
  }

  /**
   * POST /api/payment/create
   * @param {{ orderId: string }} input
   */
  async function createCheckoutLink(input, actor) {
    const { orderId } = input;
    const order = await orderRepo.findByIdOrFail(orderId);
    await assertCanPayForOrder(order, actor);

    // Defense-in-depth: charge amount is derived from the persisted order snapshot,
    // never from client-provided input.
    const amount = Number(getOrderChargeTotal(order));
    if (!Number.isInteger(amount) || amount <= 0) {
      throw badRequest("Invalid order amount for payment link creation");
    }

    const payos = getPayOSClient();

    const payosOrderCode = await allocateUniquePayosOrderCode((code) =>
      orderRepo.isPayosOrderCodeTaken(code),
    );

    await orderRepo.assignPayosOrderCode(orderId, payosOrderCode);

    const description = formatPayosDescription(
      `TaskGo ${order.serviceName}`.trim() || `Order ${order.id.slice(0, 8)}`,
    );

    const paymentPayload = {
      orderCode: payosOrderCode,
      amount,
      description,
      returnUrl: appendOrderIdQuery(env.payosReturnUrl, orderId),
      cancelUrl: appendOrderIdQuery(env.payosCancelUrl, orderId),
      items: [
        {
          name: order.serviceName.slice(0, 50),
          quantity: 1,
          price: amount,
        },
      ],
    };

    logger.info(
      { orderId, payosOrderCode, amount },
      "Creating payOS payment link",
    );

    try {
      const paymentLink = await createPaymentLink(payos, paymentPayload);
      logger.info(
        { orderId, payosOrderCode, paymentLinkId: paymentLink.paymentLinkId },
        "payOS payment link created",
      );
      return {
        ...paymentLink,
        orderId,
        payosOrderCode,
      };
    } catch (err) {
      logger.error({ err, orderId, payosOrderCode }, "payOS createPaymentLink failed");
      throw err;
    }
  }

  /**
   * POST /api/payment/webhook
   * @param {import('@payos/node').Webhook} body
   */
  async function handleWebhook(body) {
    const payos = getPayOSClient();

    let webhookData;
    try {
      webhookData = await verifyPaymentWebhookData(payos, body);
    } catch (err) {
      logger.warn({ err }, "payOS webhook signature verification failed");
      throw badRequest("Invalid payOS webhook payload");
    }

    const isSuccess =
      body.success === true &&
      (body.code === "00" || webhookData.code === "00");

    logger.info(
      {
        orderCode: webhookData.orderCode,
        amount: webhookData.amount,
        success: body.success,
        code: body.code,
      },
      "payOS webhook received",
    );

    if (!isSuccess) {
      logger.info(
        { orderCode: webhookData.orderCode, code: body.code, desc: body.desc },
        "payOS webhook ignored — payment not successful",
      );
      return { handled: false, reason: "not_success" };
    }

    const order = await orderRepo.findByPayosOrderCode(webhookData.orderCode);
    if (!order) {
      logger.error(
        { orderCode: webhookData.orderCode },
        "payOS webhook — order not found for orderCode",
      );
      throw notFound("Order not found for payOS orderCode");
    }

    const result = await paymentService.applySuccessfulPayment(order.id, {
      provider: "payos",
      amount: webhookData.amount,
      externalReference: webhookData.reference,
      correlationId: `payos-webhook-${webhookData.orderCode}`,
    });

    logger.info(
      {
        orderId: order.id,
        orderCode: webhookData.orderCode,
        alreadyPaid: result.alreadyPaid,
      },
      "payOS webhook applied — order marked paid",
    );

    return {
      handled: true,
      orderId: order.id,
      alreadyPaid: result.alreadyPaid,
    };
  }

  /**
   * GET /api/payment/status/:orderId
   */
  async function getPaymentStatus(orderId, actor) {
    const order = await orderRepo.findByIdOrFail(orderId);
    assertOrderPaymentAccess(order, actor);
    return {
      orderId: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      payosOrderCode: order.payosOrderCode ?? null,
      order: toOrderDTO(order),
    };
  }

  return {
    createCheckoutLink,
    handleWebhook,
    getPaymentStatus,
  };
}
