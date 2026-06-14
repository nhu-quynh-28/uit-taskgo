import { sendSuccess } from "../../utils/response.js";
import { toAdminDashboardResponse } from "./admin.dto.js";

export function createAdminController(adminService) {
  return {
    async dashboard(req, res) {
      const metrics = await adminService.getDashboard();
      return sendSuccess(res, req, toAdminDashboardResponse(metrics));
    },
  };
}
