import Joi from "joi";

export const sendMessageBodySchema = Joi.object({
  text: Joi.string().trim().min(1).max(2000).required(),
});

export const createThreadBodySchema = Joi.object({
  orderId: Joi.string().trim().min(1).required(),
});
