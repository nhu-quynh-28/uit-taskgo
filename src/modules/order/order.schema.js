import Joi from "joi";
import { locationSchema } from "../../validations/common.schemas.js";

export const createOrderBodySchema = Joi.object({
  serviceName: Joi.string().trim().min(1).required(),
  address: Joi.string().trim().min(1).required(),
  scheduledAt: Joi.when("bookingType", {
    is: "instant",
    then: Joi.string().trim().optional(),
    otherwise: Joi.string().trim().required(),
  }),
  bookingType: Joi.string().valid("instant", "scheduled").default("scheduled"),
  serviceId: Joi.string().trim().optional(),
  /** Optional catalog icon key from mobile (e.g. cleaning, electric) for pricing lookup. */
  serviceType: Joi.string().trim().optional(),
  customerLat: Joi.number().min(-90).max(90).optional(),
  customerLng: Joi.number().min(-180).max(180).optional(),
  notes: Joi.string().trim().optional().allow(""),
  location: locationSchema.optional(),
})
  .custom((value, helpers) => {
    const hasCoords =
      value.customerLat != null &&
      value.customerLng != null;
    const hasLocation = value.location != null;
    if (!hasCoords && !hasLocation) {
      return helpers.error("any.custom", {
        message: "Provide location or customerLat and customerLng",
      });
    }
    return value;
  });

export const payOrderBodySchema = Joi.object({
  simulateFail: Joi.boolean().optional(),
  simulateTimeout: Joi.boolean().optional(),
}).default({});
