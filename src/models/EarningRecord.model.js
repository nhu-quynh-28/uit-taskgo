import mongoose from "mongoose";
import { earningRecordSchema } from "../schemas/earningRecord.schema.js";

export const EarningRecord =
  mongoose.models.EarningRecord ??
  mongoose.model("EarningRecord", earningRecordSchema, "earning_records");
