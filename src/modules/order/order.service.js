import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  VERIFICATION_STATUS,
} from "../../config/constants.js";
import { AppError, forbidden, notFound, conflict, badRequest } from "../../utils/AppError.js";
import { assertTransition, isTerminal } from "./order.stateMachine.js";
import { toOrderDTO } from "./order.dto.js";
import { DomainEvents } from "../../events/domains/events.js";
import { resolveCreateOrderSchedule } from "../../scheduling/orderSchedule.js";
import {
  findConflictingOrders,
  getOrderScheduleWindow,
  isTaskerAvailableForWindow,
} from "../../scheduling/overlap.js";
import { ACTIVE_SCHEDULE_STATUSES } from "../../scheduling/constants.js";
import { scheduleConflict } from "../../utils/AppError.js";
import { computeOrderPricing } from "../../config/pricing.js";

export function createOrderService({
  orderRepo,
  userService,
  eventBus,
  paymentService,
  earningService,
  serviceCatalog,
}) {
  const SUSPICIOUS_LOCATION = Object.freeze({ lat: 37.7749, lng: -122.4194 });

  function normalizeLookupKey(value) {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
  }

  function isNearSuspiciousHardcodedLocation(location) {
    if (!location) return false;
    const lat = Number(location.lat);
    const lng = Number(location.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    return Math.abs(lat - SUSPICIOUS_LOCATION.lat) < 0.0001 && Math.abs(lng - SUSPICIOUS_LOCATION.lng) < 0.0001;
  }

  function assertAddressLocationConsistency(payload) {
    const hasAddress = typeof payload?.address === "string" && payload.address.trim().length > 0;
    if (!hasAddress) return;
    if (!payload.location || payload.location.lat == null || payload.location.lng == null) {
      throw badRequest("Address location is required");
    }
    if (
      isNearSuspiciousHardcodedLocation(payload.location) &&
      !normalizeLookupKey(payload.address).includes("san francisco")
    ) {
      throw badRequest("Address and location mismatch — please choose a valid saved address");
    }
  }

  async function assertTaskerScheduleFree(taskerId, windowStart, windowEnd, excludeOrderId) {
    if (typeof orderRepo.findTaskerActiveOrdersInWindow !== "function") {
      return;
    }
    // Targeted DB query — only fetches the tasker's active orders in the relevant window.
    const candidateOrders = await orderRepo.findTaskerActiveOrdersInWindow(
      taskerId,
      windowStart,
      windowEnd,
      [...ACTIVE_SCHEDULE_STATUSES],
    );
    const relevant = excludeOrderId
      ? candidateOrders.filter((o) => o.id !== excludeOrderId)
      : candidateOrders;
    if (
      !isTaskerAvailableForWindow(relevant, taskerId, windowStart, windowEnd, {
        excludeOrderId,
      })
    ) {
      const conflicts = findConflictingOrders(relevant, taskerId, windowStart, windowEnd, {
        excludeOrderId,
      });
      throw scheduleConflict("Tasker is not available for this time slot", {
        taskerId,
        scheduledStartAt: windowStart,
        scheduledEndAt: windowEnd,
        conflictingOrderIds: conflicts.map((o) => o.id),
      });
    }
  }

  async function resolveServiceForOrder(payload) {
    if (!serviceCatalog) return null;

    let service = null;
    if (payload.serviceId) {
      try {
        service = await serviceCatalog.getService(payload.serviceId);
      } catch (err) {
        if (err instanceof AppError && err.statusCode === 404) {
          // Fall through to catalog list fallback below.
        } else {
          console.error("CRITICAL DATABASE ERROR IN PRICING LOOKUP:", err);
          throw err;
        }
      }
    }

    if (service) return service;

    const idKey = normalizeLookupKey(payload.serviceId);
    const nameKey = normalizeLookupKey(payload.serviceName);
    const typeKey = normalizeLookupKey(payload.serviceType);
    if (!idKey && !nameKey && !typeKey) return null;

    let all;
    try {
      all = await serviceCatalog.listServices({ role: "admin" });
    } catch (err) {
      console.error("CRITICAL DATABASE ERROR IN PRICING LOOKUP:", err);
      throw err;
    }

    if (idKey) {
      const byId = all.find((s) => normalizeLookupKey(s.id) === idKey);
      if (byId) return byId;
    }

    if (nameKey) {
      const byName = all.find((s) => normalizeLookupKey(s.name) === nameKey);
      if (byName) return byName;
    }

    if (typeKey) {
      const byIcon = all.find((s) => normalizeLookupKey(s.icon) === typeKey);
      if (byIcon) return byIcon;
      const byTypeAsId = all.find((s) => normalizeLookupKey(s.id) === typeKey);
      if (byTypeAsId) return byTypeAsId;
    }

    return null;
  }
  function assertCanViewOrder(order, actor) {
    if (actor.role === "admin") return;
    if (actor.role === "customer" && order.customerId === actor.id) return;
    if (actor.role === "tasker" && (order.taskerId === actor.id || order.status === ORDER_STATUS.PENDING)) {
      return;
    }
    throw forbidden("Cannot access this order");
  }

  function emitStatusChange(order, actor, correlationId) {
    return eventBus.emitAsync(
      DomainEvents.ORDER_STATUS_CHANGED,
      { order: toOrderDTO(order) },
      { actorId: actor?.id, correlationId },
    );
  }

  function sanitizeClientPricingPayload(payload) {
    if (!payload || typeof payload !== "object") return payload;
    // Defense-in-depth: if upstream validation ever changes, we still refuse client pricing.
    const scrubbed = { ...payload };
    delete scrubbed.price;
    delete scrubbed.amount;
    delete scrubbed.subtotal;
    delete scrubbed.total;
    return scrubbed;
  }

  /** Admin catalog (`Service.basePrice` in MongoDB) is the sole pricing source. */
  function resolveAuthoritativeServicePrice(service) {
    if (!service || service.basePrice == null) return null;
    const base = Number(service.basePrice);
    if (!Number.isFinite(base) || base < 0) return null;
    return base;
  }

  async function createOrder(actor, payload) {
    payload = sanitizeClientPricingPayload(payload);
    assertAddressLocationConsistency(payload);

    if (actor.role === "customer") {
      await userService.assertCustomerCanBook(actor.id);
    }
    const service = await resolveServiceForOrder(payload);
    if (!service) {
      throw badRequest("Invalid service type for pricing calculation");
    }
    const schedule = resolveCreateOrderSchedule(payload, service);

    // Defense-in-depth: pricing is fully server-authoritative from the catalog document.
    // We never use any client-submitted `price/subtotal/total/amount`.
    const authoritativeSubtotal = resolveAuthoritativeServicePrice(service);
    if (authoritativeSubtotal == null) {
      throw badRequest("Invalid service type for pricing calculation");
    }
    const pricing = computeOrderPricing(authoritativeSubtotal, schedule.bookingType);

    const orderLocation =
      payload.location ??
      (payload.customerLat != null && payload.customerLng != null
        ? { lat: Number(payload.customerLat), lng: Number(payload.customerLng) }
        : { lat: 37.7749, lng: -122.4194 });

    const order = await orderRepo.create({
      customerId: actor.id,
      serviceName: service?.name ?? payload.serviceName,
      address: payload.address,
      scheduledAt: schedule.scheduledAt,
      scheduledStartAt: schedule.scheduledStartAt,
      scheduledEndAt: schedule.scheduledEndAt,
      bookingType: schedule.bookingType,
      serviceId: schedule.serviceId,
      estimatedDurationMinutes: schedule.estimatedDurationMinutes,
      notes: payload.notes || "",
      subtotal: pricing.subtotal,
      pricing,
      status: ORDER_STATUS.PENDING,
      taskerId: null,
      paymentStatus: PAYMENT_STATUS.UNPAID,
      location: orderLocation,
    });

    await eventBus.emitAsync(DomainEvents.ORDER_CREATED, { order: toOrderDTO(order) }, { actorId: actor.id });

    return toOrderDTO(order);
  }

  async function getOrder(orderId, actor) {
    const order = await orderRepo.findByIdOrFail(orderId);
    assertCanViewOrder(order, actor);
    return toOrderDTO(order);
  }

  async function listOrders(actor, query = {}) {
    const pagination = { page: Number(query.page) || 1, limit: Math.min(Number(query.limit) || 20, 100) };

    if (actor.role === "customer") {
      const result = await orderRepo.findByCustomer(actor.id, {
        ...pagination,
        status: query.status,
      });
      return { ...result, items: result.items.map(toOrderDTO) };
    }

    if (actor.role === "tasker") {
      const verified = actor.verificationStatus === VERIFICATION_STATUS.VERIFIED;
      if (verified) {
        const result = await orderRepo.findMarketplaceOrders(actor.id, pagination);
        return { ...result, items: result.items.map(toOrderDTO) };
      }
      const result = await orderRepo.findByTasker(actor.id, {
        ...pagination,
        status: query.status,
      });
      return { ...result, items: result.items.map(toOrderDTO) };
    }

    if (actor.role === "admin") {
      const result = await orderRepo.listPaginated({
        ...pagination,
        status: query.status,
        paymentStatus: query.paymentStatus,
        sort: query.sort,
      });
      return { ...result, items: result.items.map(toOrderDTO) };
    }

    return { items: [], total: 0, page: pagination.page, limit: pagination.limit };
  }

  async function getCurrentPendingPaymentOrder(actor) {
    if (actor.role !== "customer") {
      throw forbidden("Only customers can access pending payment order");
    }
    const order = await orderRepo.findLatestPendingPaymentByCustomer(actor.id);
    return order ? toOrderDTO(order) : null;
  }

  async function publishOrder(actor, orderId, correlationId) {
    if (actor.role === "customer") {
      await userService.assertCustomerCanBook(actor.id);
    }
    const order = await orderRepo.findByIdOrFail(orderId);
    if (order.customerId !== actor.id && actor.role !== "admin") {
      throw forbidden("Not your order");
    }
    if (order.status !== ORDER_STATUS.PENDING) {
      return { order: toOrderDTO(order), broadcast: { emitted: 0 } };
    }

    console.info("[publishOrder] publishing order", {
      orderId: order.id,
      customerId: order.customerId,
      address: order.address,
      location: order.location,
    });

    await eventBus.emitAsync(
      DomainEvents.ORDER_PENDING,
      { order: toOrderDTO(order) },
      { actorId: actor.id, correlationId },
    );

    return { order: toOrderDTO(order) };
  }

  async function acceptOrder(actor, orderId, correlationId) {
    await userService.assertTaskerCanAcceptJobs(actor.id);

    const pendingOrder = await orderRepo.findByIdOrFail(orderId);
    const slot = getOrderScheduleWindow(pendingOrder);
    if (slot) {
      await assertTaskerScheduleFree(actor.id, slot.start, slot.end, orderId);
    }

    const result = await orderRepo.acceptIfPending(orderId, actor.id);

    if (!result.ok) {
      if (result.code === "NOT_FOUND") throw notFound("Order not found");
      throw conflict(
        result.reason === "already_claimed"
          ? "Order has already been claimed by another tasker"
          : "Order is no longer available for acceptance",
        result.details,
      );
    }

    const order = result.order;

    if (!result.idempotent) {
      await emitStatusChange(order, actor, correlationId);
      await eventBus.emitAsync(
        DomainEvents.TASKER_ASSIGNED,
        { order: toOrderDTO(order), taskerId: actor.id },
        { actorId: actor.id, correlationId },
      );
    }

    return toOrderDTO(order);
  }

  async function arriveOrder(actor, orderId, correlationId) {
    if (actor.role === "tasker") {
      await userService.assertTaskerCanPerformJob(actor.id);
    }
    const order = await orderRepo.findByIdOrFail(orderId);
    if (order.taskerId !== actor.id) throw forbidden("Not assigned to this order");
    assertTransition(order, ORDER_STATUS.ARRIVED);
    order.status = ORDER_STATUS.ARRIVED;
    await orderRepo.save(order);
    await emitStatusChange(order, actor, correlationId);
    await eventBus.emitAsync(
      DomainEvents.ORDER_ARRIVED,
      { order: toOrderDTO(order) },
      { actorId: actor.id, correlationId },
    );
    return toOrderDTO(order);
  }

  async function startOrder(actor, orderId, correlationId) {
    if (actor.role === "tasker") {
      await userService.assertTaskerCanPerformJob(actor.id);
    }
    const order = await orderRepo.findByIdOrFail(orderId);
    if (order.taskerId !== actor.id) throw forbidden("Not assigned to this order");
    assertTransition(order, ORDER_STATUS.IN_PROGRESS);
    order.status = ORDER_STATUS.IN_PROGRESS;
    await orderRepo.save(order);
    await emitStatusChange(order, actor, correlationId);
    await eventBus.emitAsync(
      DomainEvents.ORDER_IN_PROGRESS,
      { order: toOrderDTO(order) },
      { actorId: actor.id, correlationId },
    );
    return toOrderDTO(order);
  }

  async function completeOrder(actor, orderId, correlationId) {
    if (actor.role === "tasker") {
      await userService.assertTaskerCanPerformJob(actor.id);
    }
    const order = await orderRepo.findByIdOrFail(orderId);
    if (actor.role === "tasker" && order.taskerId !== actor.id) {
      throw forbidden("Not assigned to this order");
    }
    if (actor.role === "customer") {
      throw forbidden("Customers cannot complete orders");
    }
    assertTransition(order, ORDER_STATUS.PENDING_PAYMENT);
    order.status = ORDER_STATUS.PENDING_PAYMENT;
    await orderRepo.save(order);

    const earning = await earningService.recordEarningForCompletedOrder(order);

    await emitStatusChange(order, actor, correlationId);

    return { order: toOrderDTO(order), earning };
  }

  async function cancelOrder(actor, orderId, correlationId) {
    const order = await orderRepo.findByIdOrFail(orderId);
    if (isTerminal(order.status)) {
      throw badRequest("Order is already terminal");
    }

    const canCancel =
      actor.role === "admin" ||
      (actor.role === "customer" && order.customerId === actor.id) ||
      (actor.role === "tasker" && order.taskerId === actor.id);

    if (!canCancel) throw forbidden("Cannot cancel this order");

    if (actor.role === "customer") {
      await userService.assertAccountActive(actor.id);
    }
    if (actor.role === "tasker") {
      await userService.assertTaskerCanPerformJob(actor.id);
    }

    assertTransition(order, ORDER_STATUS.CANCELLED);
    order.status = ORDER_STATUS.CANCELLED;
    await orderRepo.save(order);

    await eventBus.emitAsync(
      DomainEvents.ORDER_CANCELLED,
      { order: toOrderDTO(order) },
      { actorId: actor.id, correlationId },
    );
    await emitStatusChange(order, actor, correlationId);

    return toOrderDTO(order);
  }

  function payOrder(actor, orderId, options) {
    return paymentService.processPayOSCharge(orderId, actor, {
      ...options,
      correlationId: options.correlationId,
    });
  }

  return {
    createOrder,
    getOrder,
    getCurrentPendingPaymentOrder,
    listOrders,
    publishOrder,
    acceptOrder,
    arriveOrder,
    startOrder,
    completeOrder,
    cancelOrder,
    payOrder,
  };
}
