import { Schema } from "mongoose";
import { publicIdField } from "./common/publicId.schema.js";
import { timestampOptions } from "./common/timestamps.schema.js";

export const serviceSchema = new Schema(
  {
    ...publicIdField,
    name: { type: String, required: true, trim: true },
    /** Frontend icon key (matches screens/data.ts category ids). */
    icon: { type: String, required: true, trim: true, index: true },
    category: { type: String, required: true, trim: true, index: true },
    description: { type: String, trim: true },
    basePrice: { type: Number, min: 0 },
    durationLabel: { type: String, trim: true },
    /** Estimated duration in minutes (admin catalog). */
    estimatedDurationMinutes: { type: Number, min: 0, default: null },
    active: { type: Boolean, default: true, index: true },
  },
  timestampOptions,
);

serviceSchema.index({ category: 1, active: 1 });
