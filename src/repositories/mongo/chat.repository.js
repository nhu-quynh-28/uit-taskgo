import { newId } from "../../utils/id.js";
import { ChatThread } from "../../models/ChatThread.model.js";
import { ChatMessage } from "../../models/ChatMessage.model.js";
import { logMongoOp } from "./mongoLogger.js";
import { mapMessage, mapThread } from "./mappers.js";

export class MongoChatRepository {
  async getOrCreateThread(participantIds, orderId = null) {
    const sorted = [...participantIds].sort();
    const key = sorted.join(":");

    if (orderId) {
      const byOrder = await this.findThreadByOrderId(orderId);
      if (byOrder) return byOrder;
    }

    const existing = await ChatThread.findOne({ participantKey: key }).lean();
    if (existing) return mapThread(existing);

    return this.createThread({ orderId, participantIds: sorted });
  }

  async createThread({ orderId, participantIds }) {
    const sorted = [...participantIds].sort();
    const unreadByUser = new Map(sorted.map((id) => [id, 0]));

    const doc = await ChatThread.create({
      id: newId(),
      orderId: orderId ?? null,
      participantKey: sorted.join(":"),
      participantIds: sorted,
      latestMessage: null,
      latestMessageAt: null,
      unreadByUser,
    });

    logMongoOp("chat", "createThread", { id: doc.id, orderId });
    return mapThread(doc.toObject());
  }

  async findThread(id) {
    const doc = await ChatThread.findOne({ id }).lean();
    return mapThread(doc);
  }

  async findThreadByOrderId(orderId) {
    const doc = await ChatThread.findOne({ orderId }).lean();
    return mapThread(doc);
  }

  async listThreadsForUser(userId) {
    const docs = await ChatThread.find({ participantIds: userId })
      .sort({ latestMessageAt: -1, createdAt: -1 })
      .lean();
    return docs.map(mapThread);
  }

  async listMessages(threadId) {
    const docs = await ChatMessage.find({ threadId }).sort({ createdAt: 1 }).lean();
    return docs.map(mapMessage);
  }

  async createMessage({ threadId, senderId, text }) {
    const doc = await ChatMessage.create({
      id: newId(),
      threadId,
      senderId,
      text,
    });
    logMongoOp("chat", "createMessage", { threadId, id: doc.id });
    return mapMessage(doc.toObject());
  }

  async updateThreadAfterMessage(threadId, message, senderId) {
    const thread = await ChatThread.findOne({ id: threadId });
    if (!thread) return null;

    thread.latestMessage = {
      id: message.id,
      text: message.text,
      senderId: message.senderId,
      createdAt: new Date(message.createdAt),
    };
    thread.latestMessageAt = new Date(message.createdAt);

    for (const participantId of thread.participantIds) {
      if (participantId === senderId) continue;
      const current = thread.unreadByUser.get(participantId) ?? 0;
      thread.unreadByUser.set(participantId, current + 1);
    }

    await thread.save();
    logMongoOp("chat", "updateThreadAfterMessage", { threadId });
    return mapThread(thread.toObject());
  }

  async markThreadRead(threadId, userId) {
    const thread = await ChatThread.findOne({ id: threadId });
    if (!thread) return null;
    thread.unreadByUser.set(userId, 0);
    await thread.save();
    logMongoOp("chat", "markThreadRead", { threadId, userId });
    return mapThread(thread.toObject());
  }
}
