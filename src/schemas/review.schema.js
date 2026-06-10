import { Schema } from "mongoose";
import { publicIdField } from "./common/publicId.schema.js";
import { timestampOptions } from "./common/timestamps.schema.js";

export const reviewSchema = new Schema(
  {
    ...publicIdField,
    orderId: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, index: true },
    taskerId: { type: String, required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "", maxlength: 1000 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

reviewSchema.index({ taskerId: 1, createdAt: -1 });
reviewSchema.index({ customerId: 1, createdAt: -1 });
