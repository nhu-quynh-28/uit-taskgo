import Joi from "joi";
import { COMPLAINT_PRIORITY, COMPLAINT_STATUS } from "../../config/constants.js";

const statusValues = [
  ...Object.values(COMPLAINT_STATUS),
  "pending",
  "reviewing",
  "rejected",
];

export const updateComplaintStatusBodySchema = Joi.object({
  status: Joi.string()
    .valid(...statusValues)
    .required(),
  adminNotes: Joi.string().trim().allow("").optional(),
  assignedTo: Joi.string().trim().optional(),
});

export const createComplaintBodySchema = Joi.object({
  subject: Joi.string().trim().min(1).required(),
  customerId: Joi.string().trim().required(),
  taskerId: Joi.string().trim().required(),
  orderId: Joi.string().trim().optional(),
  category: Joi.string().trim().optional(),
  priority: Joi.string()
    .valid(...Object.values(COMPLAINT_PRIORITY))
    .optional(),
  assignedTo: Joi.string().trim().optional(),
});
