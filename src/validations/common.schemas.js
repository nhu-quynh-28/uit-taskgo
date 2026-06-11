import Joi from "joi";

export const idParamSchema = Joi.object({
  id: Joi.string().trim().min(1).required(),
});

export const orderIdParamSchema = Joi.object({
  orderId: Joi.string().trim().min(1).required(),
});

export const locationSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
});
