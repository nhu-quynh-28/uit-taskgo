import { Schema } from "mongoose";

/**
 * API-facing location { lat, lng } with GeoJSON Point for 2dsphere queries.
 * DTO transforms expose only lat/lng.
 */
export const locationSchema = new Schema(
  {
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
    geo: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
      },
    },
  },
  { _id: false },
);

locationSchema.pre("validate", function syncGeo() {
  if (this.lat == null || this.lng == null) return;
  this.geo = {
    type: "Point",
    coordinates: [this.lng, this.lat],
  };
});

export function locationToDto(location) {
  if (!location) return undefined;

  let lat;
  let lng;

  if (location.type === "Point" && Array.isArray(location.coordinates)) {
    [lng, lat] = location.coordinates;
  } else {
    lat = location.lat ?? location.geo?.coordinates?.[1];
    lng = location.lng ?? location.geo?.coordinates?.[0];
  }

  if (lat == null || lng == null) return undefined;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;

  return { lat, lng };
}

/** Normalize API { lat, lng } or GeoJSON Point for persistence on User.location */
export function normalizeUserLocationInput(input) {
  if (!input) return undefined;
  if (input.type === "Point" && Array.isArray(input.coordinates)) {
    return {
      type: "Point",
      coordinates: [Number(input.coordinates[0]), Number(input.coordinates[1])],
    };
  }
  const lat = input.lat ?? input.latitude;
  const lng = input.lng ?? input.longitude;
  if (lat == null || lng == null) return undefined;
  return {
    type: "Point",
    coordinates: [Number(lng), Number(lat)],
  };
}
