import { notFound } from "../../utils/AppError.js";
import { newId } from "../../utils/id.js";

export class InMemoryServiceRepository {
  constructor() {
    this.services = new Map();
  }

  async seed(services) {
    services.forEach((s) => this.services.set(s.id, { ...s }));
  }

  async listAll() {
    return [...this.services.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  async findById(id) {
    return this.services.get(id) ?? null;
  }

  async findByIdOrFail(id) {
    const row = await this.findById(id);
    if (!row) throw notFound("Service not found");
    return row;
  }

  async create(payload) {
    const record = {
      ...payload,
      id: payload.id ?? newId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.services.set(record.id, record);
    return record;
  }

  async update(id, patch) {
    const row = await this.findByIdOrFail(id);
    const updated = { ...row, ...patch, updatedAt: new Date().toISOString() };
    this.services.set(id, updated);
    return updated;
  }

  async delete(id) {
    const row = await this.findByIdOrFail(id);
    this.services.delete(id);
    return row;
  }

  async countActive() {
    return [...this.services.values()].filter((s) => s.active).length;
  }
}
