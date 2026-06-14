import mongoose from "mongoose";
import { paymentSchema } from "../schemas/payment.schema.js";

export const Payment =
  mongoose.models.Payment ?? mongoose.model("Payment", paymentSchema, "payments");
