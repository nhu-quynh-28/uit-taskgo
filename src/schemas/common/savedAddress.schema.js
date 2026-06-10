import { Schema } from "mongoose";

export const savedAddressSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true, trim: true },
    houseNumber: { type: String, trim: true, default: "" },
    street: { type: String, trim: true, default: "" },
    ward: { type: String, trim: true, default: "" },
    district: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    fullAddress: { type: String, trim: true, default: "" },
    /** Legacy alias for fullAddress */
    line: { type: String, trim: true, default: "" },
    latitude: { type: Number, default: undefined },
    longitude: { type: Number, default: undefined },
    isDefault: { type: Boolean, default: false },
    /** @deprecated US legacy */
    state: { type: String, trim: true, default: "" },
    postalCode: { type: String, trim: true, default: "" },
  },
  { _id: false },
);
