import { Schema } from "mongoose";
import { publicIdField } from "./common/publicId.schema.js";
import { timestampOptions } from "./common/timestamps.schema.js";

const paymentRecordStatusValues = ["succeeded", "failed", "refunded"];

export const paymentSchema = new Schema(
  {
    ...publicIdField,
    orderId: { type: String, required: true, index: true },
    traceId: { type: String, required: true, index: true },
    provider: { type: String, required: true, default: "payos_mock" },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      required: true,
      enum: paymentRecordStatusValues,
      default: "succeeded",
      index: true,
    },
    paidAt: { type: Date, default: null },
  },
  timestampOptions,
);

paymentSchema.index({ orderId: 1, createdAt: -1 });
paymentSchema.index({ traceId: 1 }, { unique: true });
