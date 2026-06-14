import { registerSocketEventHandlers } from "./handlers/socket.handler.js";
import { registerChatSocketEventHandlers } from "./handlers/chat.socket.handler.js";
import { registerReviewSocketEventHandlers } from "./handlers/review.socket.handler.js";

export function registerHandlers(eventBus, deps) {
  registerSocketEventHandlers(eventBus, deps);
  registerChatSocketEventHandlers(eventBus, deps);
  registerReviewSocketEventHandlers(eventBus, deps);
}
