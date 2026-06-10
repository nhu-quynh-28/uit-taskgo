import { newId } from "../../utils/id.js";

export class InMemoryEarningRepository {
  constructor() {
    this.earnings = new Map();
  }

  async create(record) {
    const entry = { id: newId(), ...record, createdAt: new Date().toISOString() };
    this.earnings.set(entry.id, entry);
    return entry;
  }

  async findByTaskerId(taskerId) {
    return [...this.earnings.values()].filter((e) => e.taskerId === taskerId);
  }

  async findByOrderId(orderId) {
    return [...this.earnings.values()].find((e) => e.orderId === orderId) ?? null;
  }
}
