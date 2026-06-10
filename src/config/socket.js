/**
 * Socket.io integration helpers for Express.
 * Server wiring lives in socket/index.js; this module exposes app attachment.
 */

/**
 * Share the Socket.io server instance with Express (req.app.get('socketio')).
 * @param {import('express').Express} app
 * @param {import('socket.io').Server} io
 */
export function attachSocketIo(app, io) {
  app.set("socketio", io);
}

/**
 * @param {import('express').Express} app
 * @returns {import('socket.io').Server | undefined}
 */
export function getSocketIo(app) {
  return app.get("socketio");
}
