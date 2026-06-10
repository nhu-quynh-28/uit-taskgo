import { newId } from "../../utils/id.js";

export class InMemoryChatRepository {
  constructor() {
    this.threads = new Map();
    this.messages = new Map();
  }

  async getOrCreateThread(participantIds, orderId = null) {
    const sorted = [...participantIds].sort();

    if (orderId) {
      const byOrder = await this.findThreadByOrderId(orderId);
      if (byOrder) return byOrder;
    }

    for (const thread of this.threads.values()) {
      if (thread.participantKey === sorted.join(":")) return thread;
    }

    return this.createThread({ orderId, participantIds: sorted });
  }

  async createThread({ orderId, participantIds }) {
    const sorted = [...participantIds].sort();
    const unreadByUser = {};
    for (const id of sorted) {
      unreadByUser[id] = 0;
    }

    const thread = {
      id: newId(),
      orderId: orderId ?? null,
      participantKey: sorted.join(":"),
      participantIds: sorted,
      latestMessage: null,
      latestMessageAt: null,
      unreadByUser,
      createdAt: new Date().toISOString(),
    };
    this.threads.set(thread.id, thread);
    return thread;
  }

  async findThread(id) {
    return this.threads.get(id) ?? null;
  }

  async findThreadByOrderId(orderId) {
    for (const thread of this.threads.values()) {
      if (thread.orderId === orderId) return thread;
    }
    return null;
  }

  async listThreadsForUser(userId) {
    return [...this.threads.values()]
      .filter((t) => t.participantIds.includes(userId))
      .sort((a, b) => {
        const at = a.latestMessageAt ?? a.createdAt;
        const bt = b.latestMessageAt ?? b.createdAt;
        return new Date(bt) - new Date(at);
      });
  }

  async listMessages(threadId) {
    return [...this.messages.values()]
      .filter((m) => m.threadId === threadId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  async createMessage({ threadId, senderId, text }) {
    const message = {
      id: newId(),
      threadId,
      senderId,
      text,
      createdAt: new Date().toISOString(),
    };
    this.messages.set(message.id, message);
    return message;
  }

  async updateThreadAfterMessage(threadId, message, senderId) {
    const thread = await this.findThread(threadId);
    if (!thread) return null;

    thread.latestMessage = {
      id: message.id,
      text: message.text,
      senderId: message.senderId,
      createdAt: message.createdAt,
    };
    thread.latestMessageAt = message.createdAt;

    for (const participantId of thread.participantIds) {
      if (participantId === senderId) continue;
      thread.unreadByUser[participantId] = (thread.unreadByUser[participantId] ?? 0) + 1;
    }

    return thread;
  }

  async markThreadRead(threadId, userId) {
    const thread = await this.findThread(threadId);
    if (!thread) return null;
    thread.unreadByUser[userId] = 0;
    return thread;
  }

  async seed(threads, messages) {
    for (const thread of threads) {
      this.threads.set(thread.id, { ...thread });
    }
    for (const message of messages) {
      this.messages.set(message.id, { ...message });
    }
  }
}
