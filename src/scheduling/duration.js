import { DEFAULT_SERVICE_DURATION_MINUTES } from "./constants.js";

/**
 * Parse human duration labels ("3 hours", "2–3 hours") → minutes.
 */
export function parseDurationLabelMinutes(label) {
  if (!label || typeof label !== "string") return null;
  const normalized = label.toLowerCase().replace(/–/g, "-");
  const range = normalized.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*h/);
  if (range) {
    const hi = Math.max(Number(range[1]), Number(range[2]));
    return Math.round(hi * 60);
  }
  const hours = normalized.match(/(\d+(?:\.\d+)?)\s*h/);
  if (hours) return Math.round(Number(hours[1]) * 60);
  const mins = normalized.match(/(\d+)\s*m(?:in(?:ute)?s?)?/);
  if (mins) return Number(mins[1]);
  return null;
}

export function resolveServiceDurationMinutes(service) {
  if (!service) return DEFAULT_SERVICE_DURATION_MINUTES;
  const explicit = Number(service.estimatedDurationMinutes);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const parsed = parseDurationLabelMinutes(service.durationLabel);
  return parsed ?? DEFAULT_SERVICE_DURATION_MINUTES;
}
