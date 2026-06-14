import { ChatListSkeleton } from "@/components/ux/Skeleton";
import { EmptyState } from "@/components/ux/EmptyState";
import { showAppToast } from "@/components/ux/toast";
import { authErrorMessage } from "@/lib/auth/messages";
import { useApp } from "@/screens/AppContext";
import { Card, Screen } from "@/screens/ui";
import {
  ArrowLeft,
  Check,
  ImageIcon,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { joinChatThreadRoom } from "@/lib/realtime/chatSync";
import { getSocket } from "@/lib/socket/client";

// --- ChatListScreen ---
export function ChatListScreen() {
  const {
    chatThreads,
    navigate,
    setActiveChatId,
    chatLoading,
    loadChatThreads,
    loadChatMessages,
    markChatThreadRead,
  } = useApp();
  const [q, setQ] = useState("");

  const list = chatThreads.filter((c) =>
    c.otherParticipant.name.toLowerCase().includes(q.toLowerCase()),
  );

  const openThread = async (threadId: string) => {
    setActiveChatId(threadId);
    await loadChatMessages(threadId);
    await markChatThreadRead(threadId);
    try {
      const socket = getSocket();
      if (socket.connected) await joinChatThreadRoom(socket, threadId);
    } catch {
      /* optional */
    }
    navigate("chat");
  };

  return (
    <Screen className="bg-background">
      <View className="px-5 pt-4 pb-3">
        <Text className="text-3xl font-black">Messages</Text>
        <View className="mt-4 relative justify-center">
          <View className="absolute left-4 z-10">
            <Search size={18} color="#9ca3af" />
          </View>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search conversations…"
            className="w-full h-12 pl-12 pr-4 rounded-2xl bg-muted text-sm text-foreground"
          />
        </View>
      </View>

      {chatLoading && chatThreads.length === 0 ? (
        <ChatListSkeleton />
      ) : (
      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={chatLoading && chatThreads.length > 0}
            onRefresh={() => loadChatThreads().catch(() => showAppToast("Could not refresh messages", "error"))}
            tintColor="#2E7D5B"
          />
        }
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState
            icon={<MessageCircle size={28} color="#94a3b8" />}
            title="No conversations yet"
            description="Open chat from an active order to message your tasker."
            actionLabel="View Orders"
            onAction={() => navigate("orders")}
          />
        }
        renderItem={({ item: c }) => (
          <TouchableOpacity
            onPress={() => openThread(c.id)}
            activeOpacity={0.7}
            className="flex-row items-center gap-4 py-4 border-b border-gray-50"
          >
            <View>
              <Image
                source={{ uri: c.otherParticipant.avatar }}
                className="w-14 h-14 rounded-2xl"
              />
              {c.otherParticipant.online && (
                <View className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
              )}
            </View>
            <View className="flex-1">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="font-bold text-base" numberOfLines={1}>
                  {c.otherParticipant.name}
                </Text>
                <Text className="text-[10px] text-muted-foreground">{c.time}</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted-foreground flex-1 mr-2" numberOfLines={1}>
                  {c.last}
                </Text>
                {c.unread > 0 && (
                  <View className="w-5 h-5 rounded-full bg-primary items-center justify-center">
                    <Text className="text-white text-[10px] font-bold">{c.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      )}
    </Screen>
  );
}

// --- ChatScreen ---
export function ChatScreen() {
  const {
    chatThreads,
    messagesByThreadId,
    activeChatId,
    navigate,
    orders,
    sendChatMessage,
    loadChatMessages,
    markChatThreadRead,
    setActiveOrderId,
  } = useApp();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingText, setPendingText] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const thread = chatThreads.find((c) => c.id === activeChatId) ?? chatThreads[0];
  const messages = thread ? messagesByThreadId[thread.id] ?? [] : [];
  const order = thread?.orderId
    ? orders.find((o) => o.id === thread.orderId)
    : orders.find((o) => o.tasker?.id === thread?.otherParticipant.id);

  useEffect(() => {
    if (!thread?.id) return;
    loadChatMessages(thread.id).catch(() => undefined);
    markChatThreadRead(thread.id).catch(() => undefined);
    const socket = getSocket();
    if (socket.connected) {
      joinChatThreadRoom(socket, thread.id).catch(() => undefined);
    }
  }, [thread?.id, loadChatMessages, markChatThreadRead]);

  if (!thread) {
    return (
      <Screen className="bg-background items-center justify-center px-8">
        <Text className="text-muted-foreground text-center">Select a conversation from Messages.</Text>
        <TouchableOpacity onPress={() => navigate("chatList")} className="mt-4">
          <Text className="font-bold text-primary">Back to Messages</Text>
        </TouchableOpacity>
      </Screen>
    );
  }

  const peer = thread.otherParticipant;

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setPendingText(trimmed);
    setText("");
    try {
      await sendChatMessage(thread.id, trimmed);
    } catch (err) {
      setText(trimmed);
      showAppToast(authErrorMessage(err), "error");
    } finally {
      setPendingText(null);
      setSending(false);
    }
  };

  const displayMessages = pendingText
    ? [
        ...messages,
        {
          id: "pending-local",
          text: pendingText,
          time: "Sending…",
          isMine: true,
        },
      ]
    : messages;

  return (
    <Screen className="bg-white">
      <View className="flex-row items-center px-3 h-16 border-b border-border bg-white/95">
        <TouchableOpacity
          onPress={() => navigate("chatList")}
          className="w-10 h-10 items-center justify-center"
        >
          <ArrowLeft size={22} color="black" />
        </TouchableOpacity>

        <Image source={{ uri: peer.avatar }} className="w-10 h-10 rounded-full bg-muted" />

        <View className="flex-1 ml-3">
          <Text className="font-bold text-sm leading-tight">{peer.name}</Text>
          <View className="flex-row items-center gap-1">
            {peer.online && <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            <Text className={`text-[10px] ${peer.online ? "text-emerald-600" : "text-gray-400"}`}>
              {peer.online ? "Online" : "Offline"}
            </Text>
          </View>
        </View>

        <TouchableOpacity className="w-10 h-10 items-center justify-center">
          <Phone size={20} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity className="w-10 h-10 items-center justify-center">
          <MoreVertical size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        className="flex-1"
      >
        <FlatList
          ref={flatListRef}
          data={displayMessages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View className="py-12 items-center">
              {messages.length === 0 ? (
                <Text className="text-muted-foreground text-sm">Say hello to start the conversation.</Text>
              ) : null}
            </View>
          }
          ListHeaderComponent={
            order ? (
              <TouchableOpacity
                onPress={() => {
                  setActiveOrderId(order.id);
                  navigate("orderDetail");
                }}
                activeOpacity={0.8}
                className="mb-6 self-center w-[90%]"
              >
                <Card className="p-3 flex-row items-center gap-3 bg-blue-50 border-blue-100">
                  <View className="w-10 h-10 rounded-xl bg-blue-600 items-center justify-center">
                    <order.service.icon size={20} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] text-blue-600 font-bold uppercase">Active Booking</Text>
                    <Text className="font-bold text-sm" numberOfLines={1}>
                      {order.service.name}
                    </Text>
                  </View>
                  <Text className="text-xs font-bold text-blue-600">View →</Text>
                </Card>
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item: m }) => {
            const isPending = m.id === "pending-local";
            return (
            <View className={`flex-row mb-4 ${m.isMine ? "justify-end" : "justify-start"}`}>
              <View
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  m.isMine
                    ? isPending
                      ? "bg-primary/70 rounded-br-none"
                      : "bg-primary rounded-br-none"
                    : "bg-gray-100 rounded-bl-none"
                }`}
              >
                <Text className={`text-sm ${m.isMine ? "text-white" : "text-foreground"}`}>
                  {m.text}
                </Text>
                <View
                  className={`flex-row items-center gap-1 mt-1 ${
                    m.isMine ? "justify-end" : "justify-start"
                  }`}
                >
                  <Text className={`text-[9px] ${m.isMine ? "text-white/70" : "text-gray-400"}`}>
                    {m.time}
                  </Text>
                  {m.isMine && !isPending && <Check size={10} color="rgba(255,255,255,0.7)" />}
                  {isPending ? (
                    <ActivityIndicator size={10} color="rgba(255,255,255,0.8)" />
                  ) : null}
                </View>
              </View>
            </View>
          );
          }}
        />

        <View className="p-3 bg-white border-t border-border flex-row items-center gap-2">
          <TouchableOpacity className="w-10 h-10 rounded-full bg-muted items-center justify-center">
            <Paperclip size={18} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 rounded-full bg-muted items-center justify-center">
            <ImageIcon size={18} color="#6b7280" />
          </TouchableOpacity>

          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type a message…"
            multiline
            className="flex-1 min-h-[44px] max-h-24 px-4 py-2 rounded-2xl bg-muted text-sm text-foreground"
          />

          <TouchableOpacity
            onPress={send}
            disabled={!text.trim() || sending}
            className={`w-11 h-11 rounded-full items-center justify-center ${
              text.trim() && !sending ? "bg-primary" : "bg-gray-200"
            }`}
          >
            {sending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Send size={18} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
