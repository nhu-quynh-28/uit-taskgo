import { newId } from "../../utils/id.js";

export class InMemoryReviewRepository {
  constructor(userRepo) {
    this.reviews = new Map();
    this.byOrderId = new Map();
    this.userRepo = userRepo;
  }

  async create({ orderId, customerId, taskerId, rating, comment }) {
    const review = {
      id: newId(),
      orderId,
      customerId,
      taskerId,
      rating,
      comment: comment ?? "",
      createdAt: new Date().toISOString(),
    };
    this.reviews.set(review.id, review);
    this.byOrderId.set(orderId, review.id);
    return review;
  }

  async createWithTaskerAggregate({ orderId, customerId, taskerId, rating, comment }) {
    const review = await this.create({ orderId, customerId, taskerId, rating, comment });
    const tasker = await this.userRepo.applyReviewAggregate(taskerId, rating);
    return { review, tasker };
  }

  async findById(id) {
    return this.reviews.get(id) ?? null;
  }

  async findByOrderId(orderId) {
    const id = this.byOrderId.get(orderId);
    return id ? this.reviews.get(id) ?? null : null;
  }

  async findByTaskerId(taskerId) {
    return [...this.reviews.values()]
      .filter((r) => r.taskerId === taskerId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async findByCustomerId(customerId) {
    return [...this.reviews.values()]
      .filter((r) => r.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async seed(reviews) {
    for (const review of reviews) {
      this.reviews.set(review.id, { ...review });
      this.byOrderId.set(review.orderId, review.id);
    }
  }
}
