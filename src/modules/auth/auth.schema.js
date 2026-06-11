import Joi from "joi";
import { ROLES } from "../../config/constants.js";

export const loginBodySchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const registerBodySchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().trim().min(1).required(),
  role: Joi.string()
    .valid(...ROLES.filter((r) => r !== "admin"))
    .required(),
  phone: Joi.string().trim().optional().allow(""),
});
