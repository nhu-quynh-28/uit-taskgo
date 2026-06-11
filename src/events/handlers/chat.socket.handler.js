import { DomainEvents } from "../domains/events.js";
import * as connectionManager from "../../socket/connectionManager.js";

export function registerChatSocketEventHandlers(eventBus, { io }) {
  function emitToUser(userId, event, payload) {
    const sids = connectionManager.getSocketIdsForUser(userId);
    for (const sid of sids) {
      io.to(sid).emit(event, payload);
    }
    return sids.length > 0;
  }

  eventBus.on(DomainEvents.CHAT_MESSAGE_SENT, async (envelope) => {
    const { message, thread, participantIds } = envelope.payload;

    io.to(`thread:${message.threadId}`).emit("chat:message", message);

    const threadPayload = { type: "thread_updated", thread };
    for (const userId of participantIds) {
      emitToUser(userId, "thread_updated", threadPayload);
    }
  });
}
