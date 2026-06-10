export class InMemoryPaymentRepository {
  constructor() {
    this.payments = new Map();
    this.traces = new Map();
  }

  async createTrace(trace) {
    this.traces.set(trace.id, { ...trace });
    return trace;
  }

  async updateTrace(id, patch) {
    const trace = this.traces.get(id);
    if (!trace) return null;
    const updated = { ...trace, ...patch };
    this.traces.set(id, updated);
    return updated;
  }

  async findTrace(id) {
    return this.traces.get(id) ?? null;
  }

  async createPayment(payment) {
    this.payments.set(payment.id, { ...payment });
    return payment;
  }

  async findByOrderId(orderId) {
    return [...this.payments.values()].filter((p) => p.orderId === orderId);
  }
}
