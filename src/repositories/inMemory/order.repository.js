import { notFound, conflict } from "../../utils/AppError.js";
import { ORDER_STATUS } from "../../config/constants.js";
import { newId } from "../../utils/id.js";

export class InMemoryOrderRepository {
  constructor() {
    this.orders = new Map();
    this.acceptInFlight = new Set();
  }

  async seed(orders) {
    orders.forEach((o) => this.orders.set(o.id, { ...o, __v: o.__v ?? 0 }));
  }

  async findById(id) {
    return this.orders.get(id) ?? null;
  }

  async findByIdOrFail(id) {
    const order = await this.findById(id);
    if (!order) throw notFound("Order not found");
    return order;
  }

  async findByPayosOrderCode(payosOrderCode) {
    for (const order of this.orders.values()) {
      if (order.payosOrderCode === payosOrderCode) return { ...order };
    }
    return null;
  }

  async isPayosOrderCodeTaken(payosOrderCode) {
    for (const order of this.orders.values()) {
      if (order.payosOrderCode === payosOrderCode) return true;
    }
    return false;
  }

  async assignPayosOrderCode(orderId, payosOrderCode) {
    const order = this.orders.get(orderId);
    if (!order) throw notFound("Order not found");
    const updated = { ...order, payosOrderCode, updatedAt: new Date().toISOString() };
    this.orders.set(orderId, updated);
    return updated;
  }

  async create(data) {
    const order = {
      id: newId(),
      ...data,
      __v: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.orders.set(order.id, order);
    return order;
  }

  async save(order) {
    const current = this.orders.get(order.id);
    if (!current) throw notFound("Order not found");
    const version = order.__v ?? 0;
    if (current.__v !== undefined && current.__v !== version) {
      throw conflict("Order was modified concurrently — refresh and retry");
    }
    const saved = {
      ...order,
      __v: version + 1,
      updatedAt: new Date().toISOString(),
    };
    this.orders.set(order.id, saved);
    return saved;
  }

  async listAll() {
    return [...this.orders.values()];
  }

  async findLatestPendingPaymentByCustomer(customerId) {
    const matched = [...this.orders.values()]
      .filter((order) => order.customerId === customerId && order.status === ORDER_STATUS.PENDING_PAYMENT)
      .sort((a, b) => Date.parse(b.createdAt ?? 0) - Date.parse(a.createdAt ?? 0));
    return matched[0] ?? null;
  }

  async findTaskerActiveOrdersInWindow(taskerId, windowStart, windowEnd, activeStatuses) {
    const startMs = new Date(windowStart).getTime();
    const endMs = new Date(windowEnd).getTime();
    const statusSet = new Set(activeStatuses);

    return [...this.orders.values()].filter((order) => {
      if (order.taskerId !== taskerId) return false;
      if (!statusSet.has(order.status)) return false;
      const slotStart = new Date(order.scheduledStartAt ?? order.scheduledAt).getTime();
      const slotEnd = new Date(order.scheduledEndAt ?? order.scheduledAt).getTime();
      if (Number.isNaN(slotStart) || Number.isNaN(slotEnd)) return false;
      return slotStart < endMs && slotEnd > startMs;
    });
  }

  async acceptIfPending(orderId, taskerId) {
    if (this.acceptInFlight.has(orderId)) {
      return { ok: false, reason: "accept_in_progress", code: "CONFLICT" };
    }

    this.acceptInFlight.add(orderId);
    try {
      const order = this.orders.get(orderId);
      if (!order) {
        return { ok: false, reason: "not_found", code: "NOT_FOUND" };
      }

      if (order.status === ORDER_STATUS.ACCEPTED && order.taskerId === taskerId) {
        return { ok: true, order: { ...order }, idempotent: true };
      }

      if (order.taskerId && order.taskerId !== taskerId) {
        return {
          ok: false,
          reason: "already_claimed",
          code: "CONFLICT",
          details: { taskerId: order.taskerId },
        };
      }

      if (order.status !== ORDER_STATUS.PENDING) {
        return {
          ok: false,
          reason: "invalid_status",
          code: "CONFLICT",
          details: { currentStatus: order.status },
        };
      }

      order.status = ORDER_STATUS.ACCEPTED;
      order.taskerId = taskerId;
      order.acceptedAt = new Date().toISOString();
      order.__v = (order.__v ?? 0) + 1;
      order.updatedAt = new Date().toISOString();
      this.orders.set(orderId, { ...order });
      return { ok: true, order: { ...order } };
    } finally {
      this.acceptInFlight.delete(orderId);
    }
  }
}
