import { Schema } from "mongoose";
import { ROLES, ACCOUNT_STATUS, VERIFICATION_STATUS } from "../config/constants.js";
import { geoPointSchema } from "./common/geoPoint.schema.js";
import { savedAddressSchema } from "./common/savedAddress.schema.js";
import { publicIdField } from "./common/publicId.schema.js";
import { timestampOptions } from "./common/timestamps.schema.js";

export const userSchema = new Schema(
  {
    ...publicIdField,
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ROLES, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    avatar: { type: String, default: null },
    online: { type: Boolean, default: false },
    location: { type: geoPointSchema, default: undefined },
    currentSocketId: { type: String, default: null },
    savedAddresses: { type: [savedAddressSchema], default: [] },
    /** Denormalized tasker aggregate — updated when reviews are created */
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0, min: 0 },
    accountStatus: {
      type: String,
      enum: Object.values(ACCOUNT_STATUS),
      default: ACCOUNT_STATUS.ACTIVE,
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.PENDING,
      index: true,
    },
    kyc: {
      fullName: { type: String, trim: true },
      dob: { type: String, trim: true },
      address: { type: String, trim: true },
      phone: { type: String, trim: true },
      cccdFront: { type: String },
      cccdBack: { type: String },
      submittedAt: { type: Date },
    },
    /** Catalog service IDs the tasker opts in to for job notifications */
    services: { type: [String], default: [] },
    /** Tasker public biography shown on profile */
    bio: { type: String, trim: true, default: "" },
  },
  timestampOptions,
);

userSchema.index({ role: 1, online: 1 });
userSchema.index({ location: "2dsphere" });
userSchema.index({ createdAt: -1 });

userSchema.path("email").validate(function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}, "Invalid email format");
