import { env } from "../../config/env.js";
import { ORDER_STATUS, PAYMENT_STATUS } from "../../config/constants.js";
import { badRequest, notFound, conflict } from "../../utils/AppError.js";
import { assertTransition } from "../order/order.stateMachine.js";
import { toOrderDTO } from "../order/order.dto.js";
import { newId } from "../../utils/id.js";
import { DomainEvents } from "../../events/domains/events.js";
import { getOrderChargeTotal } from "../../config/pricing.js";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldFailRandomly() {
  if (env.payosMockForceFail) return true;
  if (env.nodeEnv === "test") return false;
  return Math.random() < env.payosMockFailRate;
}

/**
 * Race a promise against a timeout.
 * Rejects with Error("PAYOS_TIMEOUT") when the deadline is exceeded.
 * The timeout timer is always cleared on resolution to avoid leaks.
 */
function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("PAYOS_TIMEOUT")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** Default provider call timeout (ms). Overridable via env. */
const PAYOS_TIMEOUT_MS = Number(env.payosTimeoutMs ?? env.payosMockTimeoutMs ?? 10_000);

export function createPaymentService({ paymentRepo, orderRepo, eventBus, userService }) {
  const payInFlight = new Set();

  async function processPayOSCharge(orderId, actor, options = {}) {
    const order = await orderRepo.findByIdOrFail(orderId);

    if (order.customerId !== actor.id && actor.role !== "admin") {
      throw badRequest("Not authorized to pay for this order");
    }
    if (actor.role === "customer") {
      await userService.assertCustomerCanBook(actor.id);
    }

    if (order.paymentStatus === PAYMENT_STATUS.PAID) {
      throw badRequest("Order is already paid");
    }

    if (order.paymentStatus === PAYMENT_STATUS.PROCESSING || payInFlight.has(orderId)) {
      throw conflict("Payment is already in progress");
    }

    payInFlight.add(orderId);
    try {
      return await chargeOrder(order, orderId, actor, options);
    } finally {
      payInFlight.delete(orderId);
    }
  }

  async function chargeOrder(initialOrder, orderId, actor, options) {
    let order = initialOrder;
    const chargeAmount = getOrderChargeTotal(order);
    const traceId = newId();
    await paymentRepo.createTrace({
      id: traceId,
      orderId,
      provider: "payos_mock",
      status: "processing",
      amount: chargeAmount,
      createdAt: new Date().toISOString(),
      attempts: [],
    });

    await eventBus.emitAsync(
      DomainEvents.PAYMENT_INITIATED,
      { orderId, traceId },
      { actorId: actor.id, correlationId: options.correlationId },
    );

    order.paymentStatus = PAYMENT_STATUS.PROCESSING;
    order = await orderRepo.save(order);

    const forceTimeout = options.forceTimeout ?? env.payosMockForceTimeout;
    const forceFail = options.forceFail ?? false;

    // Wrap the entire provider interaction with a hard timeout so a hung
    // network call can never leave the order in a PROCESSING limbo state.
    const providerCall = async () => {
      if (forceTimeout) {
        await delay(PAYOS_TIMEOUT_MS + 100);
        throw new Error("PAYOS_TIMEOUT");
      }

      await delay(Math.min(PAYOS_TIMEOUT_MS, 500));

      if (forceFail || shouldFailRandomly()) {
        throw new Error("PAYOS_PROVIDER_ERROR");
      }

      return true; // provider reported success
    };

    try {
      await withTimeout(providerCall(), PAYOS_TIMEOUT_MS);

      const paidAt = new Date().toISOString();
      const paymentInput = {
        id: newId(),
        orderId,
        traceId,
        provider: "payos_mock",
        amount: getOrderChargeTotal(order),
        status: "succeeded",
        paidAt,
      };
      const tracePatch = {
        status: "succeeded",
        completedAt: paidAt,
        attempts: [{ at: paidAt, result: "success" }],
      };

      order.paymentStatus = PAYMENT_STATUS.PAID;
      if (order.status === ORDER_STATUS.PENDING_PAYMENT) {
        assertTransition(order, ORDER_STATUS.COMPLETED);
        order.status = ORDER_STATUS.COMPLETED;
        order.completedAt = paidAt;
      }

      let payment;
      let savedOrder = order;

      if (typeof paymentRepo.finalizeSuccessfulCharge === "function") {
        ({ payment, order: savedOrder } = await paymentRepo.finalizeSuccessfulCharge({
          order,
          traceId,
          paymentInput,
          tracePatch,
        }));
      } else {
        payment = await paymentRepo.createPayment(paymentInput);
        await paymentRepo.updateTrace(traceId, tracePatch);
        savedOrder = await orderRepo.save(order);
        order = savedOrder;
      }

      await eventBus.emitAsync(
        DomainEvents.PAYMENT_SUCCEEDED,
        { order: toOrderDTO(savedOrder), payment, traceId },
        { actorId: actor.id, correlationId: options.correlationId },
      );

      return {
        success: true,
        payment,
        trace: await paymentRepo.findTrace(traceId),
        order: toOrderDTO(savedOrder),
      };
    } catch (err) {
      if (err.message !== "PAYOS_TIMEOUT" && err.message !== "PAYOS_PROVIDER_ERROR") {
        throw err;
      }
      const reason = err.message === "PAYOS_TIMEOUT" ? "timeout" : "provider_error";
      const tracePatch = {
        status: "failed",
        failureReason: reason,
        attempts: [{ at: new Date().toISOString(), result: reason }],
      };

      // Once a tasker has claimed the job, keep operational status (accepted+)
      // so tasker flows (arrive → start → complete) are not rolled back on pay failure.
      if (
        order.status !== ORDER_STATUS.CANCELLED &&
        order.status !== ORDER_STATUS.COMPLETED &&
        !order.taskerId
      ) {
        if (order.status !== ORDER_STATUS.PENDING_PAYMENT) {
          assertTransition(order, ORDER_STATUS.PENDING_PAYMENT);
        }
        order.status = ORDER_STATUS.PENDING_PAYMENT;
      }
      order.paymentStatus = PAYMENT_STATUS.FAILED;
      order.lastPaymentTraceId = traceId;

      let failedOrder = order;
      if (typeof paymentRepo.finalizeFailedCharge === "function") {
        failedOrder = await paymentRepo.finalizeFailedCharge({ order, traceId, tracePatch });
      } else {
        await paymentRepo.updateTrace(traceId, tracePatch);
        failedOrder = await orderRepo.save(order);
        order = failedOrder;
      }

      const failedOrderDto = toOrderDTO(failedOrder);
      const failedTrace = await paymentRepo.findTrace(traceId);

      await eventBus.emitAsync(
        DomainEvents.PAYMENT_FAILED,
        { order: failedOrderDto, trace: failedTrace, retryable: true },
        { actorId: actor.id, correlationId: options.correlationId },
      );

      return {
        success: false,
        retryable: true,
        message: "Payment could not be completed. Please retry.",
        trace: failedTrace,
        order: failedOrderDto,
      };
    }
  }

  async function getTrace(traceId) {
    const trace = await paymentRepo.findTrace(traceId);
    if (!trace) throw notFound("Payment trace not found");
    return trace;
  }

  /**
   * Mark order paid after an external provider (payOS webhook) confirms success.
   * Idempotent when the order is already paid.
   */
  async function applySuccessfulPayment(orderId, options = {}) {
    const order = await orderRepo.findByIdOrFail(orderId);

    if (order.paymentStatus === PAYMENT_STATUS.PAID) {
      return {
        alreadyPaid: true,
        order: toOrderDTO(order),
        payment: null,
        traceId: order.lastPaymentTraceId ?? null,
      };
    }

    const traceId = options.traceId ?? newId();
    const provider = options.provider ?? "payos";
    const chargeAmount = options.amount ?? getOrderChargeTotal(order);

    await paymentRepo.createTrace({
      id: traceId,
      orderId,
      provider,
      status: "processing",
      amount: chargeAmount,
      createdAt: new Date().toISOString(),
      attempts: [],
    });

    const paidAt = new Date().toISOString();
    const paymentInput = {
      id: newId(),
      orderId,
      traceId,
      provider,
      amount: chargeAmount,
      status: "succeeded",
      paidAt,
    };
    const tracePatch = {
      status: "succeeded",
      completedAt: paidAt,
      attempts: [
        {
          at: paidAt,
          result: "success",
          reference: options.externalReference ?? undefined,
        },
      ],
    };

    order.paymentStatus = PAYMENT_STATUS.PAID;
    if (order.status === ORDER_STATUS.PENDING_PAYMENT) {
      assertTransition(order, ORDER_STATUS.COMPLETED);
      order.status = ORDER_STATUS.COMPLETED;
      order.completedAt = paidAt;
    }
    order.lastPaymentTraceId = traceId;

    let payment;
    let savedOrder = order;

    if (typeof paymentRepo.finalizeSuccessfulCharge === "function") {
      ({ payment, order: savedOrder } = await paymentRepo.finalizeSuccessfulCharge({
        order,
        traceId,
        paymentInput,
        tracePatch,
      }));
    } else {
      payment = await paymentRepo.createPayment(paymentInput);
      await paymentRepo.updateTrace(traceId, tracePatch);
      savedOrder = await orderRepo.save(order);
    }

    await eventBus.emitAsync(
      DomainEvents.PAYMENT_SUCCEEDED,
      { order: toOrderDTO(savedOrder), payment, traceId },
      { actorId: options.actorId ?? null, correlationId: options.correlationId },
    );

    return {
      alreadyPaid: false,
      order: toOrderDTO(savedOrder),
      payment,
      traceId,
    };
  }

  return { processPayOSCharge, getTrace, applySuccessfulPayment };
}
