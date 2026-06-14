import { verifyToken } from "../config/jwt.js";
import * as connectionManager from "./connectionManager.js";

export function authenticateSocket(getUserById) {
  return async (socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) return next(new Error("Unauthorized"));

    try {
      const decoded = verifyToken(token);
      const user = await getUserById(decoded.sub);
      if (!user) return next(new Error("Unauthorized"));
      socket.data.user = { id: user.id, role: user.role, name: user.name };
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  };
}

export function registerChatHandlers(io, socket, chatService) {
  connectionManager.joinUserRoom(socket, socket.data.user.id);

  socket.emit("connection:ack", {
    socketId: socket.id,
    userId: socket.data.user.id,
    reconnected: Boolean(socket.handshake.auth?.reconnected),
  });

  socket.on("chat:join", async ({ threadId }, ack) => {
    try {
      if (!threadId) {
        ack?.({ success: false, error: "threadId required" });
        return;
      }
      await chatService.assertCanJoin(threadId, socket.data.user.id);
      connectionManager.joinThreadRoom(socket, threadId);
      ack?.({ success: true });
    } catch (err) {
      ack?.({ success: false, error: err.message });
    }
  });

  socket.on("chat:message", async (payload, ack) => {
    try {
      const userId = connectionManager.getUserId(socket.id);
      if (!userId) {
        ack?.({ success: false, error: "Not authenticated" });
        return;
      }
      if (!payload?.threadId || !payload?.text?.trim()) {
        ack?.({ success: false, error: "threadId and text required" });
        return;
      }

      const { message } = await chatService.sendMessage({
        threadId: payload.threadId,
        senderId: userId,
        text: payload.text.trim(),
        correlationId: payload.correlationId,
      });

      ack?.({ success: true, data: message });
    } catch (err) {
      ack?.({ success: false, error: err.message });
    }
  });
}
