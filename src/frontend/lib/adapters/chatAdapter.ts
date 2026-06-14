import type { ChatMessageDTO, ChatThreadDTO } from "@/lib/api/chat";

export type ChatThread = {
  id: string;
  orderId: string | null;
  otherParticipant: {
    id: string;
    name: string;
    avatar: string;
    online: boolean;
  };
  last: string;
  time: string;
  unread: number;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  time: string;
  isMine: boolean;
};

export function formatChatTime(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "now";
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function threadDtoToListItem(dto: ChatThreadDTO): ChatThread {
  const other = dto.otherParticipant ?? {
    id: "unknown",
    name: "User",
    avatar: null,
    online: false,
  };

  return {
    id: dto.id,
    orderId: dto.orderId,
    otherParticipant: {
      id: other.id,
      name: other.name,
      avatar: other.avatar ?? "https://i.pravatar.cc/200?img=12",
      online: other.online,
    },
    last: dto.latestMessage?.text ?? "No messages yet",
    time: formatChatTime(dto.latestMessageAt ?? dto.createdAt),
    unread: dto.unreadCount ?? 0,
  };
}

export function messageDtoToUi(dto: ChatMessageDTO, myUserId: string): ChatMessage {
  return {
    id: dto.id,
    senderId: dto.senderId,
    text: dto.text,
    time: formatChatTime(dto.createdAt),
    isMine: dto.senderId === myUserId,
  };
}

export function threadDtoFromPayload(dto: ChatThreadDTO): ChatThread {
  return threadDtoToListItem(dto);
}
