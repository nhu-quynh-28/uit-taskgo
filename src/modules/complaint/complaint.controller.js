import { sendSuccess } from "../../utils/response.js";

export function createComplaintController(complaintService) {
  return {
    async list(req, res) {
      return sendSuccess(res, req, await complaintService.listComplaints());
    },
    async getById(req, res) {
      return sendSuccess(res, req, await complaintService.getComplaint(req.params.id));
    },
    async updateStatus(req, res) {
      return sendSuccess(
        res,
        req,
        await complaintService.updateStatus(req.params.id, req.user.id, req.body),
      );
    },
  };
}
