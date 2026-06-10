import { Schema } from "mongoose";

/** MongoDB GeoJSON Point — coordinates are [longitude, latitude]. */
export const geoPointSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] },
  },
  { _id: false },
);

/**
 * Build a GeoJSON Point from lng/lat (floats).
 * @param {number} lng
 * @param {number} lat
 */
export function toGeoPoint(lng, lat) {
  return {
    type: "Point",
    coordinates: [Number(lng), Number(lat)],
  };
}
