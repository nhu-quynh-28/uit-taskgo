import { DomainEvents } from "../domains/events.js";
import * as connectionManager from "../../socket/connectionManager.js";

export function registerReviewSocketEventHandlers(eventBus, { io, repos }) {
  function emitToUser(userId, event, payload) {
    const sids = connectionManager.getSocketIdsForUser(userId);
    for (const sid of sids) {
      io.to(sid).emit(event, payload);
    }
  }

  eventBus.on(DomainEvents.REVIEW_CREATED, async (envelope) => {
    const { review, taskerStats } = envelope.payload;
    const payload = { type: "review_created", review, taskerStats };

    emitToUser(review.customerId, "review_created", payload);
    emitToUser(review.taskerId, "review_created", payload);
  });
}
