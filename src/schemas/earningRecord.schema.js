import { Schema } from "mongoose";
import { publicIdField } from "./common/publicId.schema.js";
import { timestampOptions } from "./common/timestamps.schema.js";

const ratesSchema = new Schema(
  {
    platformFeeRate: { type: Number, required: true },
    taskerCommissionRate: { type: Number, required: true },
  },
  { _id: false },
);

const earningStatusValues = ["pending", "settled", "reversed"];

export const earningRecordSchema = new Schema(
  {
    ...publicIdField,
    orderId: { type: String, required: true, unique: true, index: true },
    taskerId: { type: String, required: true, index: true },
    customerId: { type: String, required: true, index: true },
    gross: { type: Number, required: true, min: 0 },
    platformFee: { type: Number, required: true, min: 0 },
    taskerNet: { type: Number, required: true, min: 0 },
    rates: { type: ratesSchema, required: true },
    status: {
      type: String,
      required: true,
      enum: earningStatusValues,
      default: "settled",
      index: true,
    },
  },
  timestampOptions,
);

earningRecordSchema.index({ taskerId: 1, createdAt: -1 });
