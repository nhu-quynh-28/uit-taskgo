import { sendSuccess } from "../../utils/response.js";

export function createEarningController(earningService) {
  return {
    async getMyEarnings(req, res) {
      return sendSuccess(res, req, await earningService.getSummary(req.user.id));
    },
    async getTaskerEarnings(req, res) {
      return sendSuccess(res, req, await earningService.getSummary(req.params.taskerId));
    },
  };
}
