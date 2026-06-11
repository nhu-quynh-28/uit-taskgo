const socketToUser = new Map();
const userToSockets = new Map();

export function registerConnection(socketId, userId) {
  socketToUser.set(socketId, userId);
  if (!userToSockets.has(userId)) userToSockets.set(userId, new Set());
  userToSockets.get(userId).add(socketId);
}

export function unregisterConnection(socketId) {
  const userId = socketToUser.get(socketId);
  if (!userId) return null;
  socketToUser.delete(socketId);
  const set = userToSockets.get(userId);
  if (set) {
    set.delete(socketId);
    if (set.size === 0) userToSockets.delete(userId);
  }
  return userId;
}

export function getUserId(socketId) {
  return socketToUser.get(socketId) ?? null;
}

export function getSocketIdsForUser(userId) {
  return [...(userToSockets.get(userId) ?? [])];
}

export function isUserOnline(userId) {
  return userToSockets.has(userId) && userToSockets.get(userId).size > 0;
}

export function joinUserRoom(socket, userId) {
  socket.join(`user:${userId}`);
}

export function joinThreadRoom(socket, threadId) {
  socket.join(`thread:${threadId}`);
}
