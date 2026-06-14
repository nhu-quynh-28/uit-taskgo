import { Schema } from "mongoose";
import { COMPLAINT_PRIORITY, COMPLAINT_STATUS } from "../config/constants.js";
import { publicIdField } from "./common/publicId.schema.js";
import { timestampOptions } from "./common/timestamps.schema.js";

export const complaintSchema = new Schema(
  {
    ...publicIdField,
    subject: { type: String, required: true, trim: true },
    customerId: { type: String, required: true, index: true },
    taskerId: { type: String, required: true, index: true },
    orderId: { type: String, index: true },
    category: { type: String, trim: true, default: "General" },
    priority: {
      type: String,
      enum: Object.values(COMPLAINT_PRIORITY),
      default: COMPLAINT_PRIORITY.MEDIUM,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(COMPLAINT_STATUS),
      default: COMPLAINT_STATUS.OPEN,
      index: true,
    },
    assignedTo: { type: String, trim: true, default: "Admin Team" },
    adminNotes: { type: String, trim: true, default: "" },
    resolvedBy: { type: String, default: null },
    resolvedAt: { type: Date, default: null },
  },
  timestampOptions,
);

complaintSchema.index({ status: 1, createdAt: -1 });
