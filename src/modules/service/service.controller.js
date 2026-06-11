import { sendSuccess, sendCreated } from "../../utils/response.js";

export function createServiceController(serviceService) {
  return {
    async list(req, res) {
      return sendSuccess(res, req, await serviceService.listServices(req.user));
    },
    async getById(req, res) {
      return sendSuccess(res, req, await serviceService.getService(req.params.id));
    },
    async create(req, res) {
      return sendCreated(res, req, await serviceService.createService(req.body));
    },
    async update(req, res) {
      return sendSuccess(res, req, await serviceService.updateService(req.params.id, req.body));
    },
    async remove(req, res) {
      return sendSuccess(res, req, await serviceService.deleteService(req.params.id));
    },
  };
}
