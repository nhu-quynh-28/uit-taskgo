import { notFound, conflict } from "../../utils/AppError.js";
import { ORDER_STATUS } from "../../config/constants.js";
import { newId } from "../../utils/id.js";
import { Order } from "../../models/Order.model.js";
import { logMongoOp } from "./mongoLogger.js";
import { mapOrder, parseDate } from "./mappers.js";

function orderToUpdateSet(order) {
  const set = {
    customerId: order.customerId,
    taskerId: order.taskerId,
    serviceName: order.serviceName,
    address: order.address,
    scheduledAt: parseDate(order.scheduledAt),
    scheduledStartAt: order.scheduledStartAt ? parseDate(order.scheduledStartAt) : parseDate(order.scheduledAt),
    scheduledEndAt: order.scheduledEndAt ? parseDate(order.scheduledEndAt) : null,
    bookingType: order.bookingType ?? "scheduled",
    serviceId: order.serviceId ?? null,
    estimatedDurationMinutes: order.estimatedDurationMinutes ?? null,
    notes: order.notes ?? "",
    subtotal: order.subtotal,
    pricing: order.pricing,
    status: order.status,
    paymentStatus: order.paymentStatus,
    location: order.location,
    acceptedAt: order.acceptedAt ? parseDate(order.acceptedAt) : null,
    completedAt: order.completedAt ? parseDate(order.completedAt) : null,
    lastPaymentTraceId: order.lastPaymentTraceId ?? null,
  };
  if (order.payosOrderCode != null) {
    set.payosOrderCode = order.payosOrderCode;
  }
  return set;
}

export class MongoOrderRepository {
  async seed(orders) {
    for (const o of orders) {
      const payload = {
        ...o,
        scheduledAt: parseDate(o.scheduledAt),
        scheduledStartAt: o.scheduledStartAt ? parseDate(o.scheduledStartAt) : parseDate(o.scheduledAt),
        scheduledEndAt: o.scheduledEndAt ? parseDate(o.scheduledEndAt) : null,
        acceptedAt: o.acceptedAt ? parseDate(o.acceptedAt) : null,
        completedAt: o.completedAt ? parseDate(o.completedAt) : null,
      };
      await Order.updateOne({ id: o.id }, { $setOnInsert: payload }, { upsert: true });
    }
    logMongoOp("order", "seed", { count: orders.length });
  }

  async findById(id) {
    const doc = await Order.findOne({ id }).lean();
    return mapOrder(doc);
  }

  async findByIdOrFail(id) {
    const order = await this.findById(id);
    if (!order) throw notFound("Order not found");
    return order;
  }

  async findByPayosOrderCode(payosOrderCode) {
    const doc = await Order.findOne({ payosOrderCode }).lean();
    return mapOrder(doc);
  }

  async isPayosOrderCodeTaken(payosOrderCode) {
    const exists = await Order.exists({ payosOrderCode });
    return Boolean(exists);
  }

  async assignPayosOrderCode(orderId, payosOrderCode) {
    const doc = await Order.findOneAndUpdate(
      { id: orderId },
      { $set: { payosOrderCode } },
      { new: true, runValidators: true },
    ).lean();
    if (!doc) throw notFound("Order not found");
    logMongoOp("order", "assignPayosOrderCode", { orderId, payosOrderCode });
    return mapOrder(doc);
  }

  async create(data) {
    const order = {
      id: newId(),
      ...data,
      scheduledAt: parseDate(data.scheduledAt),
      scheduledStartAt: data.scheduledStartAt
        ? parseDate(data.scheduledStartAt)
        : parseDate(data.scheduledAt),
      scheduledEndAt: data.scheduledEndAt ? parseDate(data.scheduledEndAt) : null,
    };
    const doc = await Order.create(order);
    logMongoOp("order", "create", { id: order.id });
    return mapOrder(doc.toObject());
  }

  async save(order) {
    const version = order.__v ?? 0;
    const doc = await Order.findOneAndUpdate(
      { id: order.id, __v: version },
      { $set: orderToUpdateSet(order), $inc: { __v: 1 } },
      { new: true, runValidators: true },
    ).lean();

    if (!doc) {
      throw conflict("Order was modified concurrently — refresh and retry");
    }

    logMongoOp("order", "save", { id: order.id, version });
    return mapOrder(doc);
  }

  async listAll() {
    const docs = await Order.find({}).lean();
    return docs.map(mapOrder);
  }

  /**
   * Paginated order listing for a specific customer, sorted newest-first.
   * Uses compound index (customerId, createdAt).
   */
  async findByCustomer(customerId, { page = 1, limit = 20, status } = {}) {
    const filter = { customerId };
    if (status) filter.status = status;
    const skip = (Math.max(1, page) - 1) * limit;
    const [docs, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);
    logMongoOp("order", "findByCustomer", { customerId, page, limit });
    return { items: docs.map(mapOrder), total, page, limit };
  }

  async findLatestPendingPaymentByCustomer(customerId) {
    const doc = await Order.findOne({
      customerId,
      status: ORDER_STATUS.PENDING_PAYMENT,
    })
      .sort({ createdAt: -1 })
      .lean();
    return mapOrder(doc);
  }

  /**
   * Active/assigned orders for a tasker.
   * Uses compound index (taskerId, status, createdAt).
   */
  async findByTasker(taskerId, { page = 1, limit = 20, status } = {}) {
    const filter = { taskerId };
    if (status) filter.status = status;
    const skip = (Math.max(1, page) - 1) * limit;
    const [docs, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);
    logMongoOp("order", "findByTasker", { taskerId, page, limit });
    return { items: docs.map(mapOrder), total, page, limit };
  }

  /**
   * Open marketplace orders a verified tasker can see (PENDING + their own).
   * Uses index on (status, createdAt).
   */
  async findMarketplaceOrders(taskerId, { page = 1, limit = 20 } = {}) {
    const filter = { $or: [{ status: ORDER_STATUS.PENDING }, { taskerId }] };
    const skip = (Math.max(1, page) - 1) * limit;
    const [docs, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);
    logMongoOp("order", "findMarketplaceOrders", { taskerId, page, limit });
    return { items: docs.map(mapOrder), total, page, limit };
  }

  /**
   * Admin paginated order listing with optional status/paymentStatus filters.
   * Uses compound index (status, paymentStatus) or (createdAt).
   */
  async listPaginated({ page = 1, limit = 20, status, paymentStatus, sort = "newest" } = {}) {
    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    const sortOrder = sort === "oldest" ? 1 : -1;
    const skip = (Math.max(1, page) - 1) * limit;
    const [docs, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: sortOrder }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);
    logMongoOp("order", "listPaginated", { page, limit, status, paymentStatus });
    return { items: docs.map(mapOrder), total, page, limit };
  }

  /**
   * Count orders grouped by status — for dashboard stats without full load.
   */
  async countByStatus() {
    const agg = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const map = {};
    for (const { _id, count } of agg) map[_id] = count;
    return map;
  }

  /**
   * Recent N orders for the dashboard — uses (createdAt) index.
   */
  async findRecent(limit = 5) {
    const docs = await Order.find({}).sort({ createdAt: -1 }).limit(limit).lean();
    return docs.map(mapOrder);
  }

  /**
   * Active orders for a tasker within a date window — schedule overlap check.
   * Avoids full collection scan by filtering on taskerId + active statuses + date range.
   */
  async findTaskerActiveOrdersInWindow(taskerId, windowStart, windowEnd, activeStatuses) {
    const docs = await Order.find({
      taskerId,
      status: { $in: activeStatuses },
      scheduledStartAt: { $lt: windowEnd },
      $or: [
        { scheduledEndAt: { $gt: windowStart } },
        { scheduledEndAt: null, scheduledStartAt: { $gte: windowStart } },
      ],
    }).lean();
    logMongoOp("order", "findTaskerActiveOrdersInWindow", { taskerId });
    return docs.map(mapOrder);
  }

  /**
   * Total revenue from paid orders — aggregation instead of full load.
   */
  async sumPaidRevenue() {
    const [result] = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$subtotal" } } },
    ]);
    return result?.total ?? 0;
  }

  /**
   * Monthly revenue buckets for chart — aggregation pipeline replaces in-memory grouping.
   */
  async monthlyRevenueChart() {
    return Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          revenue: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$subtotal", 0],
            },
          },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  /**
   * Atomic accept — replaces in-memory acceptInFlight mutex.
   */
  async acceptIfPending(orderId, taskerId) {
    const existing = await Order.findOne({ id: orderId }).lean();
    if (!existing) {
      return { ok: false, reason: "not_found", code: "NOT_FOUND" };
    }

    if (existing.status === ORDER_STATUS.ACCEPTED && existing.taskerId === taskerId) {
      return { ok: true, order: mapOrder(existing), idempotent: true };
    }

    const now = new Date();
    const doc = await Order.findOneAndUpdate(
      {
        id: orderId,
        status: ORDER_STATUS.PENDING,
        $or: [{ taskerId: null }, { taskerId }],
      },
      {
        $set: {
          status: ORDER_STATUS.ACCEPTED,
          taskerId,
          acceptedAt: now,
        },
        $inc: { __v: 1 },
      },
      { new: true, runValidators: true },
    ).lean();

    if (doc) {
      logMongoOp("order", "acceptIfPending", { orderId, taskerId, accepted: true });
      return { ok: true, order: mapOrder(doc) };
    }

    const current = await Order.findOne({ id: orderId }).lean();
    if (!current) {
      return { ok: false, reason: "not_found", code: "NOT_FOUND" };
    }
    if (current.status !== ORDER_STATUS.PENDING) {
      return {
        ok: false,
        reason: "invalid_status",
        code: "CONFLICT",
        details: { currentStatus: current.status },
      };
    }
    if (current.taskerId && current.taskerId !== taskerId) {
      return {
        ok: false,
        reason: "already_claimed",
        code: "CONFLICT",
        details: { taskerId: current.taskerId },
      };
    }

    return { ok: false, reason: "accept_in_progress", code: "CONFLICT" };
  }
}
