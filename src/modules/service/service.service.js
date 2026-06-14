import { toServiceDTO } from "./service.dto.js";

export function createServiceService({ serviceRepo }) {
  async function listServices(actor) {
    const rows = await serviceRepo.listAll();
    const visible =
      actor?.role === "admin" ? rows : rows.filter((s) => s.active !== false);
    return visible.map(toServiceDTO);
  }

  async function getService(id) {
    return toServiceDTO(await serviceRepo.findByIdOrFail(id));
  }

  async function createService(payload) {
    const created = await serviceRepo.create({
      name: payload.name,
      icon: payload.icon,
      category: payload.category,
      description: payload.description ?? "",
      basePrice: Number(payload.basePrice) || 0,
      durationLabel: payload.durationLabel ?? "",
      estimatedDurationMinutes: payload.estimatedDurationMinutes ?? null,
      active: payload.active ?? true,
    });
    return toServiceDTO(created);
  }

  async function updateService(id, payload) {
    const updated = await serviceRepo.update(id, payload);
    return toServiceDTO(updated);
  }

  async function deleteService(id) {
    const removed = await serviceRepo.delete(id);
    return toServiceDTO(removed);
  }

  return { listServices, getService, createService, updateService, deleteService };
}
