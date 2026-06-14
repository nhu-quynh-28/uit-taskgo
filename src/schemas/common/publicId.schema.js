import { Schema } from "mongoose";
import { newId } from "../../utils/id.js";

/**
 * Public API identifier (UUID string) — matches in-memory `id` field.
 */
export const publicIdField = {
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => newId(),
    index: true,
  },
};

export const publicIdSchema = new Schema(publicIdField, { _id: true });
