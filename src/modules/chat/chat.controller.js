import { sendSuccess, sendCreated } from "../../utils/response.js";

export function createChatController(chatService) {
  const correlation = (req) => req.requestId;

  return {
    async listThreads(req, res) {
      return sendSuccess(res, req, await chatService.listThreads(req.user.id));
    },
    async openThread(req, res) {
      const thread = await chatService.openThread(req.user, req.body.orderId);
      return sendCreated(res, req, thread);
    },
    async getMessages(req, res) {
      return sendSuccess(res, req, await chatService.getMessages(req.params.threadId, req.user.id));
    },
    async sendMessage(req, res) {
      const { message } = await chatService.sendMessage({
        threadId: req.params.threadId,
        senderId: req.user.id,
        text: req.body.text,
        correlationId: correlation(req),
      });
      return sendCreated(res, req, message);
    },
    async markRead(req, res) {
      const thread = await chatService.markThreadRead(req.params.threadId, req.user.id);
      return sendSuccess(res, req, thread);
    },
  };
}
