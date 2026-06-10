import mongoose from "mongoose";
import { customerSchema } from "../schemas/customer.schema.js";

export const Customer =
  mongoose.models.Customer ?? mongoose.model("Customer", customerSchema, "customers");
