import mongoose from "mongoose";
import { chatThreadSchema } from "../schemas/chatThread.schema.js";

export const ChatThread =
  mongoose.models.ChatThread ??
  mongoose.model("ChatThread", chatThreadSchema, "chat_threads");
