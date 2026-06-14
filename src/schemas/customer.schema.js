import { Schema } from "mongoose";
import { publicIdField } from "./common/publicId.schema.js";
import { timestampOptions } from "./common/timestamps.schema.js";

export const customerSchema = new Schema(
  {
    ...publicIdField,
    /** Optional link to users collection (role customer). */
    userId: { type: String, trim: true, index: true, sparse: true },
    name: { type: String, required: true, trim: true },
    avatar: { type: String, default: null },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
  },
  timestampOptions,
);
