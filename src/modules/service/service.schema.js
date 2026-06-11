import Joi from "joi";

export const createServiceBodySchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  icon: Joi.string().trim().min(1).required(),
  category: Joi.string().trim().min(1).required(),
  description: Joi.string().trim().allow("").optional(),
  basePrice: Joi.number().min(0).required(),
  durationLabel: Joi.string().trim().allow("").optional(),
  estimatedDurationMinutes: Joi.number().integer().min(0).allow(null).optional(),
  active: Joi.boolean().optional(),
});

export const updateServiceBodySchema = Joi.object({
  name: Joi.string().trim().min(1).optional(),
  icon: Joi.string().trim().min(1).optional(),
  category: Joi.string().trim().min(1).optional(),
  description: Joi.string().trim().allow("").optional(),
  basePrice: Joi.number().min(0).optional(),
  durationLabel: Joi.string().trim().allow("").optional(),
  estimatedDurationMinutes: Joi.number().integer().min(0).allow(null).optional(),
  active: Joi.boolean().optional(),
}).min(1);
