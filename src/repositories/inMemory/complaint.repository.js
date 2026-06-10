import { notFound } from "../../utils/AppError.js";
import { newId } from "../../utils/id.js";

export class InMemoryComplaintRepository {
  constructor() {
    this.complaints = new Map();
  }

  async seed(complaints) {
    complaints.forEach((c) => this.complaints.set(c.id, { ...c }));
  }

  async listAll() {
    return [...this.complaints.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async findById(id) {
    return this.complaints.get(id) ?? null;
  }

  async findByIdOrFail(id) {
    const row = await this.findById(id);
    if (!row) throw notFound("Complaint not found");
    return row;
  }

  async create(payload) {
    const record = {
      ...payload,
      id: payload.id ?? newId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.complaints.set(record.id, record);
    return record;
  }

  async update(id, patch) {
    const row = await this.findByIdOrFail(id);
    const updated = { ...row, ...patch, updatedAt: new Date().toISOString() };
    this.complaints.set(id, updated);
    return updated;
  }
}
