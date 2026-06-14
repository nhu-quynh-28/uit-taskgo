import { conflict } from "../../utils/AppError.js";
import { newId } from "../../utils/id.js";
import { Review } from "../../models/Review.model.js";
import { withTransaction, isDuplicateKeyError } from "./session.js";
import { logMongoOp } from "./mongoLogger.js";
import { mapReview } from "./mappers.js";

export class MongoReviewRepository {
  constructor({ userRepo }) {
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
    };

    try {
      const doc = await Review.create(review);
      logMongoOp("review", "create", { id: review.id, orderId });
      return mapReview(doc.toObject());
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw conflict("A review already exists for this order");
      }
      throw err;
    }
  }

  /**
   * Transactional review insert + tasker aggregate update.
   */
  async createWithTaskerAggregate({ orderId, customerId, taskerId, rating, comment }) {
    return withTransaction(async (session) => {
      const reviewPayload = {
        id: newId(),
        orderId,
        customerId,
        taskerId,
        rating,
        comment: comment ?? "",
      };

      let reviewDoc;
      try {
        const created = await Review.create([reviewPayload], { session });
        reviewDoc = created[0];
      } catch (err) {
        if (isDuplicateKeyError(err)) {
          throw conflict("A review already exists for this order");
        }
        throw err;
      }

      const tasker = await this.userRepo.applyReviewAggregate(taskerId, rating, session);
      logMongoOp("review", "createWithTaskerAggregate", { orderId, taskerId });
      return { review: mapReview(reviewDoc.toObject()), tasker };
    }, { label: "review.createWithTaskerAggregate" });
  }

  async findById(id) {
    const doc = await Review.findOne({ id }).lean();
    return mapReview(doc);
  }

  async findByOrderId(orderId) {
    const doc = await Review.findOne({ orderId }).lean();
    return mapReview(doc);
  }

  async findByTaskerId(taskerId) {
    const docs = await Review.find({ taskerId }).sort({ createdAt: -1 }).lean();
    return docs.map(mapReview);
  }

  async findByCustomerId(customerId) {
    const docs = await Review.find({ customerId }).sort({ createdAt: -1 }).lean();
    return docs.map(mapReview);
  }
}
