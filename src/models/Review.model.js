import mongoose from "mongoose";
import { reviewSchema } from "../schemas/review.schema.js";

export const Review =
  mongoose.models.Review ?? mongoose.model("Review", reviewSchema, "reviews");
