import { Schema } from "mongoose";
import { publicIdField } from "./common/publicId.schema.js";
import { timestampOptions } from "./common/timestamps.schema.js";

const latestMessageSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true, maxlength: 4000 },
    senderId: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { _id: false },
);

export const chatThreadSchema = new Schema(
  {
    ...publicIdField,
    /** One thread per order when set */
    orderId: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
      index: true,
    },
    participantKey: { type: String, required: true, index: true },
    participantIds: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length >= 2,
        message: "participantIds must include at least two users",
      },
      index: true,
    },
    latestMessage: { type: latestMessageSchema, default: null },
    latestMessageAt: { type: Date, default: null, index: true },
    unreadByUser: {
      type: Map,
      of: { type: Number, min: 0, default: 0 },
      default: () => new Map(),
    },
  },
  timestampOptions,
);

chatThreadSchema.index({ participantIds: 1, latestMessageAt: -1 });
chatThreadSchema.index({ createdAt: -1 });
