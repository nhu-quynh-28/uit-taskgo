import mongoose from "mongoose";
import { taskerSchema } from "../schemas/tasker.schema.js";

export const Tasker =
  mongoose.models.Tasker ?? mongoose.model("Tasker", taskerSchema, "taskers");
