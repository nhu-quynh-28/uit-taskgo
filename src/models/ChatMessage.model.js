import mongoose from "mongoose";
import { chatMessageSchema } from "../schemas/chatMessage.schema.js";

export const ChatMessage =
  mongoose.models.ChatMessage ??
  mongoose.model("ChatMessage", chatMessageSchema, "chat_messages");
