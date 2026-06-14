import type { Socket } from "socket.io-client";
import type { ChatMessageDTO, ChatThreadDTO } from "@/lib/api/chat";

export type ChatSyncHandlers = {
  onMessage: (message: ChatMessageDTO) => void;
  onThreadUpdated: (thread: ChatThreadDTO) => void;
  loadThreads: () => Promise<void>;
  loadMessages: (threadId: string) => Promise<void>;
  activeChatIdRef: { current?: string };
};

export function attachChatSync(socket: Socket, handlers: ChatSyncHandlers): () => void {
  const onMessage = (message: ChatMessageDTO) => {
    if (!message?.id) return;
    handlers.onMessage(message);
  };

  const onThreadUpdated = (payload: { thread?: ChatThreadDTO }) => {
    if (!payload?.thread?.id) return;
    handlers.onThreadUpdated(payload.thread);
  };

  const refetch = () => {
    handlers.loadThreads().catch(() => undefined);
    if (handlers.activeChatIdRef.current) {
      handlers.loadMessages(handlers.activeChatIdRef.current).catch(() => undefined);
    }
  };

  socket.on("chat:message", onMessage);
  socket.on("thread_updated", onThreadUpdated);
  socket.on("connect", refetch);
  socket.on("connection:ack", refetch);

  return () => {
    socket.off("chat:message", onMessage);
    socket.off("thread_updated", onThreadUpdated);
    socket.off("connect", refetch);
    socket.off("connection:ack", refetch);
  };
}

export function joinChatThreadRoom(socket: Socket, threadId: string): Promise<void> {
  return new Promise((resolve) => {
    socket.emit("chat:join", { threadId }, (ack?: { success?: boolean }) => {
      resolve();
      if (ack && !ack.success) {
        /* join failed — REST still works */
      }
    });
  });
}
