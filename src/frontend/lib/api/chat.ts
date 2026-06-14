import { apiRequest } from "./client";

export type ChatMessageDTO = {
  id: string;
  threadId: string;
  senderId: string;
  text: string;
  createdAt: string;
};

export type ChatParticipantDTO = {
  id: string;
  name: string;
  avatar: string | null;
  online: boolean;
};

export type ChatThreadDTO = {
  id: string;
  orderId: string | null;
  participantIds: string[];
  latestMessage: ChatMessageDTO | null;
  latestMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
  otherParticipant: ChatParticipantDTO | null;
};

export async function listChatThreadsRequest(): Promise<ChatThreadDTO[]> {
  const { data } = await apiRequest<ChatThreadDTO[]>("get", "/chat/threads");
  return data;
}

export async function openChatThreadRequest(orderId: string): Promise<ChatThreadDTO> {
  const { data } = await apiRequest<ChatThreadDTO>("post", "/chat/threads", {
    body: { orderId },
  });
  return data;
}

export async function listChatMessagesRequest(threadId: string): Promise<ChatMessageDTO[]> {
  const { data } = await apiRequest<ChatMessageDTO[]>(
    "get",
    `/chat/threads/${threadId}/messages`,
  );
  return data;
}

export async function sendChatMessageRequest(
  threadId: string,
  text: string,
): Promise<ChatMessageDTO> {
  const { data } = await apiRequest<ChatMessageDTO>("post", `/chat/threads/${threadId}/messages`, {
    body: { text },
  });
  return data;
}

export async function markChatThreadReadRequest(threadId: string): Promise<ChatThreadDTO> {
  const { data } = await apiRequest<ChatThreadDTO>("post", `/chat/threads/${threadId}/read`);
  return data;
}
