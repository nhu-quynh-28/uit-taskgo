import { Schema } from "mongoose";
import { publicIdField } from "./common/publicId.schema.js";
import { timestampOptions } from "./common/timestamps.schema.js";

export const chatMessageSchema = new Schema(
  {
    ...publicIdField,
    threadId: { type: String, required: true, index: true },
    senderId: { type: String, required: true, index: true },
    text: { type: String, required: true, trim: true, maxlength: 4000 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

chatMessageSchema.index({ threadId: 1, createdAt: 1 });
chatMessageSchema.index({ createdAt: -1 });
