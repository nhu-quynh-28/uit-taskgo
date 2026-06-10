import mongoose from "mongoose";
import { complaintSchema } from "../schemas/complaint.schema.js";

export const Complaint =
  mongoose.models.Complaint ?? mongoose.model("Complaint", complaintSchema, "complaints");
