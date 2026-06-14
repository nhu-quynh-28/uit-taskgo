import { Schema } from "mongoose";
import { ORDER_STATUS, PAYMENT_STATUS } from "../config/constants.js";
import { locationSchema } from "./common/location.schema.js";
import { publicIdField } from "./common/publicId.schema.js";
import { timestampOptions } from "./common/timestamps.schema.js";

const orderStatusValues = Object.values(ORDER_STATUS);
const paymentStatusValues = Object.values(PAYMENT_STATUS);

export const orderSchema = new Schema(
  {
    ...publicIdField,
    customerId: { type: String, required: true, index: true },
    taskerId: { type: String, default: null, index: true },
    serviceName: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    scheduledAt: { type: Date, required: true, index: true },
    scheduledStartAt: { type: Date, index: true },
    scheduledEndAt: { type: Date, index: true },
    bookingType: { type: String, enum: ["instant", "scheduled"], default: "scheduled" },
    serviceId: { type: String, trim: true, default: null },
    estimatedDurationMinutes: { type: Number, min: 0, default: null },
    notes: { type: String, default: "", maxlength: 2000 },
    subtotal: { type: Number, required: true, min: 0 },
    pricing: {
      subtotal: { type: Number, required: true, min: 0 },
      schedulingFee: { type: Number, required: true, min: 0 },
      platformFee: { type: Number, required: true, min: 0 },
      total: { type: Number, required: true, min: 0 },
    },
    status: {
      type: String,
      required: true,
      enum: orderStatusValues,
      default: ORDER_STATUS.PENDING,
      index: true,
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: paymentStatusValues,
      default: PAYMENT_STATUS.UNPAID,
      index: true,
    },
    location: { type: locationSchema, required: true },
    acceptedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    lastPaymentTraceId: { type: String, default: null },
    /** payOS payment link orderCode (positive integer, unique per link). */
    payosOrderCode: {
      type: Number,
      index: {
        unique: true,
        partialFilterExpression: { payosOrderCode: { $gt: 0 } },
      },
    },
  },
  {
    ...timestampOptions,
    versionKey: "__v",
    optimisticConcurrency: true,
  },
);

orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ taskerId: 1, status: 1, createdAt: -1 });
orderSchema.index({ status: 1, paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
