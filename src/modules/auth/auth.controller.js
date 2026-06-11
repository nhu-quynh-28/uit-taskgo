import { sendSuccess, sendCreated } from "../../utils/response.js";

export function createAuthController(authService) {
  return {
    async register(req, res) {
      const result = await authService.register(req.body);
      return sendCreated(res, req, result);
    },
    async login(req, res) {
      const result = await authService.login(req.body);
      return sendSuccess(res, req, result);
    },
  };
}
