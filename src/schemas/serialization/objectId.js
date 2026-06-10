import mongoose from "mongoose";

/**
 * Normalize any reference value to a string id for DTOs / queries.
 */
export function normalizeRefId(value) {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (typeof value === "object" && value.id) return String(value.id);
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
}

export function normalizeRefIds(values) {
  if (!Array.isArray(values)) return [];
  return values.map((v) => normalizeRefId(v)).filter(Boolean);
}

export function isValidObjectIdString(value) {
  return typeof value === "string" && mongoose.Types.ObjectId.isValid(value);
}

/**
 * Build a query filter accepting either public `id` or Mongo `_id`.
 */
export function idFilter(publicId) {
  if (!publicId) return null;
  const filter = { id: publicId };
  if (mongoose.Types.ObjectId.isValid(publicId) && String(new mongoose.Types.ObjectId(publicId)) === publicId) {
    return { $or: [{ id: publicId }, { _id: publicId }] };
  }
  return filter;
}
