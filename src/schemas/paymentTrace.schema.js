import { Schema } from "mongoose";
import { publicIdField } from "./common/publicId.schema.js";
import { timestampOptions } from "./common/timestamps.schema.js";

const attemptSchema = new Schema(
  {
    at: { type: Date, required: true },
    result: { type: String, required: true },
  },
  { _id: false },
);

const traceStatusValues = ["processing", "succeeded", "failed"];

export const paymentTraceSchema = new Schema(
  {
    ...publicIdField,
    orderId: { type: String, required: true, index: true },
    provider: { type: String, required: true, default: "payos_mock" },
    status: {
      type: String,
      required: true,
      enum: traceStatusValues,
      default: "processing",
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    failureReason: { type: String, default: null },
    completedAt: { type: Date, default: null },
    attempts: { type: [attemptSchema], default: [] },
  },
  timestampOptions,
);

paymentTraceSchema.index({ orderId: 1, createdAt: -1 });
