import { sendSuccess } from "../../utils/response.js";

export function createUserController(userService) {
  return {
    async getMe(req, res) {
      return sendSuccess(res, req, await userService.getProfile(req.user.id));
    },
    async updateMe(req, res) {
      return sendSuccess(
        res,
        req,
        await userService.updateProfile(req.user.id, req.user.role, req.user.id, req.body),
      );
    },
    async submitKyc(req, res) {
      return sendSuccess(
        res,
        req,
        await userService.submitKyc(req.user.id, req.body),
      );
    },
    async getUserById(req, res) {
      const user = await userService.getProfile(req.params.id);
      console.log(
        ">>> [BACKEND CHECK] Dữ liệu chuẩn bị trả về cho Admin:",
        JSON.stringify(user, null, 2),
      );
      return sendSuccess(res, req, user);
    },
    async updateUserById(req, res) {
      return sendSuccess(
        res,
        req,
        await userService.updateProfile(req.user.id, req.user.role, req.params.id, req.body),
      );
    },
    async listTaskers(req, res) {
      const query = req.validatedQuery ?? req.query;
      try {
        const taskers = await userService.listTaskers(query);
        return sendSuccess(res, req, taskers);
      } catch (err) {
        console.error("[GET /api/users/taskers] Failed to list taskers", {
          message: err?.message,
          code: err?.code,
          name: err?.name,
          query,
          userId: req.user?.id,
          role: req.user?.role,
        });
        if (err?.stack) {
          console.error(err.stack);
        }
        throw err;
      }
    },
    async blockUser(req, res) {
      return sendSuccess(res, req, await userService.blockUser(req.params.id, "customer"));
    },
    async unblockUser(req, res) {
      return sendSuccess(res, req, await userService.unblockUser(req.params.id, "customer"));
    },
  };
}
