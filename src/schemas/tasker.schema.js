import { Schema } from "mongoose";
import { publicIdField } from "./common/publicId.schema.js";
import { locationSchema } from "./common/location.schema.js";
import { timestampOptions } from "./common/timestamps.schema.js";

export const taskerSchema = new Schema(
  {
    ...publicIdField,
    /** Optional link to users collection (role tasker). */
    userId: { type: String, trim: true, index: true, sparse: true },
    name: { type: String, required: true, trim: true },
    avatar: { type: String, default: null },
    rating: { type: Number, required: true, min: 0, max: 5 },
    skills: { type: [String], default: [] },
    completedJobs: { type: Number, default: 0, min: 0 },
    location: { type: locationSchema, default: undefined },
    isOnline: { type: Boolean, default: false, index: true },
    bio: { type: String, trim: true },
    hourlyRate: { type: Number, min: 0 },
    verified: { type: Boolean, default: true },
  },
  timestampOptions,
);

taskerSchema.index({ isOnline: 1, rating: -1 });
taskerSchema.index({ "location.geo": "2dsphere" });
