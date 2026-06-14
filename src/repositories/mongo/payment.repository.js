import { newId } from "../../utils/id.js";
import { Payment } from "../../models/Payment.model.js";
import { PaymentTrace } from "../../models/PaymentTrace.model.js";
import { Order } from "../../models/Order.model.js";
import { withTransaction } from "./session.js";
import { logMongoOp } from "./mongoLogger.js";
import { mapOrder, mapPayment, mapTrace, parseDate } from "./mappers.js";

export class MongoPaymentRepository {
  async createTrace(trace) {
    const doc = await PaymentTrace.create({
      ...trace,
      createdAt: parseDate(trace.createdAt) ?? new Date(),
      completedAt: trace.completedAt ? parseDate(trace.completedAt) : null,
    });
    logMongoOp("payment", "createTrace", { id: trace.id });
    return mapTrace(doc.toObject());
  }

  async updateTrace(id, patch) {
    const doc = await PaymentTrace.findOneAndUpdate(
      { id },
      {
        $set: {
          ...patch,
          completedAt: patch.completedAt ? parseDate(patch.completedAt) : patch.completedAt,
        },
      },
      { new: true, runValidators: true },
    ).lean();
    logMongoOp("payment", "updateTrace", { id });
    return mapTrace(doc);
  }

  async findTrace(id) {
    const doc = await PaymentTrace.findOne({ id }).lean();
    return mapTrace(doc);
  }

  async createPayment(payment) {
    const doc = await Payment.create({
      ...payment,
      paidAt: payment.paidAt ? parseDate(payment.paidAt) : null,
    });
    logMongoOp("payment", "createPayment", { id: payment.id });
    return mapPayment(doc.toObject());
  }

  async findByOrderId(orderId) {
    const docs = await Payment.find({ orderId }).lean();
    return docs.map(mapPayment);
  }

  /**
   * Persist successful charge: payment record + trace + order in one transaction.
   */
  async finalizeSuccessfulCharge({
    order,
    traceId,
    paymentInput,
    tracePatch,
  }) {
    return withTransaction(async (session) => {
      const payment = await Payment.create(
        [
          {
            ...paymentInput,
            id: paymentInput.id ?? newId(),
            paidAt: parseDate(paymentInput.paidAt) ?? new Date(),
          },
        ],
        { session },
      );

      await PaymentTrace.updateOne(
        { id: traceId },
        { $set: tracePatch },
        { session },
      );

      const version = order.__v ?? 0;
      const orderDoc = await Order.findOneAndUpdate(
        { id: order.id, __v: version },
        { $set: orderToUpdateSet(order), $inc: { __v: 1 } },
        { new: true, runValidators: true, session },
      ).lean();

      if (!orderDoc) {
        throw new Error("Order concurrent update during payment finalization");
      }

      logMongoOp("payment", "finalizeSuccessfulCharge", { orderId: order.id, traceId });
      return {
        payment: mapPayment(payment[0].toObject()),
        order: mapOrder(orderDoc),
      };
    }, { label: "payment.finalizeSuccessfulCharge" });
  }

  /**
   * Persist failed charge: trace + order in one transaction.
   */
  async finalizeFailedCharge({ order, traceId, tracePatch }) {
    return withTransaction(async (session) => {
      await PaymentTrace.updateOne({ id: traceId }, { $set: tracePatch }, { session });

      const version = order.__v ?? 0;
      const orderDoc = await Order.findOneAndUpdate(
        { id: order.id, __v: version },
        { $set: orderToUpdateSet(order), $inc: { __v: 1 } },
        { new: true, runValidators: true, session },
      ).lean();

      if (!orderDoc) {
        throw new Error("Order concurrent update during payment failure");
      }

      logMongoOp("payment", "finalizeFailedCharge", { orderId: order.id, traceId });
      return mapOrder(orderDoc);
    }, { label: "payment.finalizeFailedCharge" });
  }
}

function orderToUpdateSet(order) {
  const set = {
    customerId: order.customerId,
    taskerId: order.taskerId,
    serviceName: order.serviceName,
    address: order.address,
    scheduledAt: parseDate(order.scheduledAt),
    notes: order.notes ?? "",
    subtotal: order.subtotal,
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
