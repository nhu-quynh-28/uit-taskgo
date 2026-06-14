import http from "http";
import { createApp } from "../../backend/src/app.js";
import { resetRepositoriesForTests } from "../../backend/src/config/database.js";
import { createSocketServer } from "../../backend/src/socket/index.js";
import { attachSocketIo } from "../../backend/src/config/socket.js";

/**
 * HTTP + Socket.IO server for performance scripts (ephemeral port).
 * @returns {Promise<{ app: import('express').Application, server: import('http').Server, io: import('socket.io').Server, baseUrl: string, port: number, container: object }>}
 */
export async function startTestServer() {
  await resetRepositoriesForTests();
  const { app, container } = createApp();
  const server = http.createServer(app);
  const io = createSocketServer(server, {
    authService: container.services.auth,
    userService: container.services.user,
    userRepo: container.repos.user,
    chatService: container.services.chat,
  });
  attachSocketIo(app, io);
  container.registerEventHandlers(io);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  return { app, server, io, baseUrl, port, container };
}

export async function stopTestServer(server, io) {
  await new Promise((resolve, reject) => {
    io.close((err) => (err ? reject(err) : resolve()));
  });
  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}
