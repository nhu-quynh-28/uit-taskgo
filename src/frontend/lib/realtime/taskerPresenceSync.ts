import type { Socket } from "socket.io-client";
import { getTaskerGpsCoordinates } from "@/lib/location/taskerGps";

export const TASKER_LOCATION_INTERVAL_MS = 30_000;

export type TaskerPresenceSyncOptions = {
  userId: string;
  /** Latest online flag (tasker accepting jobs). */
  getIsOnline: () => boolean;
  /** When false, skip periodic GPS emits (e.g. app backgrounded). */
  getIsActive?: () => boolean;
};

function emitRegisterSession(socket: Socket, userId: string) {
  socket.emit("register_session", { userId });
}

export function emitTaskerToggleOnline(socket: Socket, userId: string, isOnline: boolean) {
  if (!socket.connected) return;
  socket.emit("toggle_online", { userId, isOnline });
}

async function emitTaskerLocationUpdate(socket: Socket, userId: string) {
  const coords = await getTaskerGpsCoordinates();
  if (!coords || !socket.connected) return;
  socket.emit("update_location", {
    userId,
    lng: coords.lng,
    lat: coords.lat,
  });
}

/**
 * Registers tasker socket session and pushes GPS while online.
 * Caller must invoke teardown on logout / role change.
 */
export function attachTaskerPresenceSync(
  socket: Socket,
  options: TaskerPresenceSyncOptions,
): () => void {
  const { userId, getIsOnline, getIsActive } = options;

  const pushLocationIfOnline = () => {
    if (getIsActive?.() === false) return;
    if (!getIsOnline()) return;
    void emitTaskerLocationUpdate(socket, userId);
  };

  const onConnect = () => {
    emitRegisterSession(socket, userId);
    emitTaskerToggleOnline(socket, userId, getIsOnline());
    pushLocationIfOnline();
  };

  socket.on("connect", onConnect);
  if (socket.connected) onConnect();

  const intervalId = setInterval(pushLocationIfOnline, TASKER_LOCATION_INTERVAL_MS);

  return () => {
    clearInterval(intervalId);
    socket.off("connect", onConnect);
  };
}
