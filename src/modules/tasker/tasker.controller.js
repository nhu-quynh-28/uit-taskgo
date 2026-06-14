import { sendSuccess } from "../../utils/response.js";

export function createTaskerController(userService) {
  return {
    async verify(req, res) {
      return sendSuccess(res, req, await userService.verifyTasker(req.params.id));
    },
    async reject(req, res) {
      return sendSuccess(res, req, await userService.rejectTasker(req.params.id));
    },
    async block(req, res) {
      return sendSuccess(res, req, await userService.blockUser(req.params.id, "tasker"));
    },
    async unblock(req, res) {
      return sendSuccess(res, req, await userService.unblockUser(req.params.id, "tasker"));
    },
  };
}
