export function toMessageDTO(message) {
  return {
    id: message.id,
    threadId: message.threadId,
    senderId: message.senderId,
    text: message.text,
    createdAt: message.createdAt,
  };
}

export function toThreadDTO(thread, viewerUserId, otherParticipant = null) {
  const unreadCount = thread.unreadByUser?.[viewerUserId] ?? 0;
  const latest = thread.latestMessage
    ? {
        id: thread.latestMessage.id,
        text: thread.latestMessage.text,
        senderId: thread.latestMessage.senderId,
        createdAt: thread.latestMessage.createdAt,
      }
    : null;

  return {
    id: thread.id,
    orderId: thread.orderId ?? null,
    participantIds: thread.participantIds,
    latestMessage: latest,
    latestMessageAt: thread.latestMessageAt ?? null,
    unreadCount,
    createdAt: thread.createdAt,
    otherParticipant,
  };
}
