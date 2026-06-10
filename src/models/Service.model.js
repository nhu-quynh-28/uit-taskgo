import mongoose from "mongoose";
import { serviceSchema } from "../schemas/service.schema.js";

export const Service =
  mongoose.models.Service ?? mongoose.model("Service", serviceSchema, "services");
