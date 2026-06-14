import Joi from "joi";

export const createPayosPaymentBodySchema = Joi.object({
  orderId: Joi.string().trim().min(1).required(),
});
