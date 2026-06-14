import mongoose from "mongoose";
import { paymentTraceSchema } from "../schemas/paymentTrace.schema.js";

export const PaymentTrace =
  mongoose.models.PaymentTrace ??
  mongoose.model("PaymentTrace", paymentTraceSchema, "payment_traces");
