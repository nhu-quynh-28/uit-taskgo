import { io, type Socket } from "socket.io-client";
import { config } from "../config";
import { getAccessToken } from "../storage/token";

export type SocketAuthPayload = {
  token: string;
  reconnected?: boolean;
};

let socket: Socket | null = null;

/**
 * Returns the shared Socket.IO instance (lazy, not connected until connectSocket()).
 * URL from EXPO_PUBLIC_SOCKET_URL (see lib/config.ts) — use LAN IP on physical devices.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(config.socketUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 5_000,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

/**
 * Connect with JWT from secure storage. No-op if already connected.
 * Phase 5 will call this after login; screens must not call yet.
 */
export async function connectSocket(options?: { reconnected?: boolean }): Promise<Socket> {
  const instance = getSocket();
  const token = await getAccessToken();

  if (!token) {
    throw new Error("Cannot connect socket without access token");
  }

  instance.auth = {
    token,
    reconnected: options?.reconnected ?? false,
  } satisfies SocketAuthPayload;

  if (!instance.connected) {
    instance.connect();
  }

  return instance;
}

/** Disconnect and clear auth; keeps singleton for reuse. Detach listeners via attachOrderSync teardown first. */
export function disconnectSocket(): void {
  if (!socket) return;
  socket.disconnect();
  socket.auth = {};
}

/** True when socket exists and is connected. */
export function isSocketConnected(): boolean {
  return Boolean(socket?.connected);
}
