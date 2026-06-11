import { DomainEvents } from "../domains/events.js";
import { ORDER_STATUS } from "../../config/constants.js";
import * as connectionManager from "../../socket/connectionManager.js";
import {
  dispatchJobNoLongerAvailable,
  dispatchNewJobAvailable,
} from "../../socket/taskerDispatch.js";

export function registerSocketEventHandlers(eventBus, { io, repos }) {
  function emitToUser(userId, event, payload) {
    const sids = connectionManager.getSocketIdsForUser(userId);
    for (const sid of sids) {
      io.to(sid).emit(event, payload);
    }
    return sids.length > 0;
  }

  async function broadcastPendingJobToNearbyTaskers(order) {
    if (order.status !== ORDER_STATUS.PENDING) return;
    await dispatchNewJobAvailable(io, repos.user, order);
  }

  eventBus.on(DomainEvents.ORDER_CREATED, async (envelope) => {
    await broadcastPendingJobToNearbyTaskers(envelope.payload.order);
  });

  eventBus.on(DomainEvents.ORDER_PENDING, async (envelope) => {
    await broadcastPendingJobToNearbyTaskers(envelope.payload.order);
  });

  eventBus.on(DomainEvents.ORDER_STATUS_CHANGED, async (envelope) => {
    const order = envelope.payload.order;
    const payload = { type: "order_status_updated", order };
    notifyOrderParties(order, payload);
  });

  eventBus.on(DomainEvents.TASKER_ASSIGNED, async (envelope) => {
    const order = envelope.payload.order;
    const assignedTaskerId = envelope.payload.taskerId ?? order.taskerId;

    emitToUser(order.customerId, "tasker_assigned", {
      type: "tasker_assigned",
      order,
      taskerId: assignedTaskerId,
    });

    if (assignedTaskerId) {
      await dispatchJobNoLongerAvailable(io, repos.user, order, {
        excludeTaskerId: assignedTaskerId,
      });
    }
  });

  eventBus.on(DomainEvents.PAYMENT_FAILED, async (envelope) => {
    const { order, trace, retryable } = envelope.payload;
    emitToUser(order.customerId, "payment_failed", {
      type: "payment_failed",
      order,
      trace,
      retryable,
    });
  });

  eventBus.on(DomainEvents.ORDER_CANCELLED, async (envelope) => {
    const order = envelope.payload.order;
    await dispatchJobNoLongerAvailable(io, repos.user, order, {
      excludeTaskerId: order.taskerId ?? null,
    });
  });

  function notifyOrderParties(order, payload) {
    emitToUser(order.customerId, "order_status_updated", payload);
    if (order.taskerId) {
      emitToUser(order.taskerId, "order_status_updated", payload);
    }
  }
}
