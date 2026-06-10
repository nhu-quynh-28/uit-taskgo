import mongoose from "mongoose";
import { orderSchema } from "../schemas/order.schema.js";

export const Order =
  mongoose.models.Order ?? mongoose.model("Order", orderSchema, "orders");
