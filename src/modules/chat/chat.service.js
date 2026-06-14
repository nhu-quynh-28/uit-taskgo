import { badRequest, forbidden, notFound } from "../../utils/AppError.js";
import { toMessageDTO, toThreadDTO } from "./chat.dto.js";
import { DomainEvents } from "../../events/domains/events.js";

export function createChatService({ chatRepo, orderRepo, userRepo, eventBus }) {
  async function assertThreadParticipant(threadId, userId) {
    const thread = await chatRepo.findThread(threadId);
    if (!thread) throw notFound("Thread not found");
    if (!thread.participantIds.includes(userId)) {
      throw forbidden("Not a participant in this thread");
    }
    return thread;
  }

  async function resolveOtherParticipant(thread, viewerUserId) {
    const otherId = thread.participantIds.find((id) => id !== viewerUserId);
    if (!otherId) return null;
    const user = await userRepo.findById(otherId);
    if (!user) {
      return { id: otherId, name: "User", avatar: null, online: false };
    }
    return {
      id: user.id,
      name: user.name,
      avatar: user.avatar ?? null,
      online: Boolean(user.online),
    };
  }

  async function enrichThread(thread, viewerUserId) {
    const other = await resolveOtherParticipant(thread, viewerUserId);
    return toThreadDTO(thread, viewerUserId, other);
  }

  function assertOrderAccess(order, actor) {
    if (actor.role === "admin") return;
    if (actor.role === "customer" && order.customerId === actor.id) return;
    if (actor.role === "tasker" && order.taskerId === actor.id) return;
    throw forbidden("Cannot access this order");
  }

  async function listThreads(userId) {
    const threads = await chatRepo.listThreadsForUser(userId);
    return Promise.all(threads.map((t) => enrichThread(t, userId)));
  }

  async function openThread(actor, orderId) {
    const order = await orderRepo.findByIdOrFail(orderId);
    assertOrderAccess(order, actor);

    if (!order.taskerId) {
      throw badRequest("Cannot open chat until a tasker is assigned to the order");
    }

    let thread = await chatRepo.findThreadByOrderId(orderId);
    if (!thread) {
      thread = await chatRepo.createThread({
        orderId,
        participantIds: [order.customerId, order.taskerId],
      });
    }

    return enrichThread(thread, actor.id);
  }

  async function getMessages(threadId, userId) {
    await assertThreadParticipant(threadId, userId);
    const messages = await chatRepo.listMessages(threadId);
    return messages.map(toMessageDTO);
  }

  async function markThreadRead(threadId, userId) {
    await assertThreadParticipant(threadId, userId);
    await chatRepo.markThreadRead(threadId, userId);
    const thread = await chatRepo.findThread(threadId);
    return enrichThread(thread, userId);
  }

  async function sendMessage({ threadId, senderId, text, correlationId }) {
    await assertThreadParticipant(threadId, senderId);
    const message = await chatRepo.createMessage({ threadId, senderId, text });
    const thread = await chatRepo.updateThreadAfterMessage(threadId, message, senderId);
    const messageDto = toMessageDTO(message);
    const threadDto = await enrichThread(thread, senderId);

    await eventBus.emitAsync(
      DomainEvents.CHAT_MESSAGE_SENT,
      {
        message: messageDto,
        thread: threadDto,
        participantIds: thread.participantIds,
      },
      { actorId: senderId, correlationId },
    );

    return { message: messageDto, thread: threadDto };
  }

  async function assertCanJoin(threadId, userId) {
    await assertThreadParticipant(threadId, userId);
  }

  return {
    listThreads,
    openThread,
    getMessages,
    sendMessage,
    markThreadRead,
    assertCanJoin,
    assertThreadParticipant,
  };
}
