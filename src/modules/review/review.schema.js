import Joi from "joi";

export const createReviewBodySchema = Joi.object({
  orderId: Joi.string().trim().min(1).required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().trim().max(1000).allow("").optional(),
});

export const taskerIdParamSchema = Joi.object({
  taskerId: Joi.string().trim().min(1).required(),
});
