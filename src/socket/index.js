import { Server } from "socket.io";
import { env } from "../config/env.js";
import * as connectionManager from "./connectionManager.js";
import { authenticateSocket, registerChatHandlers } from "./chat.handlers.js";
import { registerTaskerPresenceHandlers } from "./taskerPresence.handlers.js";

export function createSocketServer(httpServer, { authService, userService, userRepo, chatService }) {
  const io = new Server(httpServer, {
    cors: { origin: env.corsOrigin, methods: ["GET", "POST"] },
  });

  io.use(authenticateSocket(authService.getUserById));

  io.on("connection", (socket) => {
    const user = socket.data.user;
    connectionManager.registerConnection(socket.id, user.id);

    if (user.role === "tasker") {
      void userService.setTaskerOnline(user.id, true);
    }

    registerChatHandlers(io, socket, chatService);
    registerTaskerPresenceHandlers(socket, { userRepo, userService });

    socket.on("disconnect", () => {
      void userRepo.clearCurrentSocketId(socket.id);

      // Keep in-memory connection tracking accurate, but do not force
      // tasker online status to offline on passive socket disconnect.
      connectionManager.unregisterConnection(socket.id);
    });
  });

  return io;
}
