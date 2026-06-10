import { MongoUserRepository } from "./user.repository.js";
import { MongoOrderRepository } from "./order.repository.js";
import { MongoChatRepository } from "./chat.repository.js";
import { MongoReviewRepository } from "./review.repository.js";
import { MongoPaymentRepository } from "./payment.repository.js";
import { MongoEarningRepository } from "./earning.repository.js";
import { InMemoryIdempotencyRepository } from "../inMemory/idempotency.repository.js";
import { MongoServiceRepository } from "./service.repository.js";
import { MongoComplaintRepository } from "./complaint.repository.js";

export function createMongoRepositories() {
  const user = new MongoUserRepository();
  const order = new MongoOrderRepository();
  const payment = new MongoPaymentRepository();
  const earning = new MongoEarningRepository();
  const chat = new MongoChatRepository();
  const review = new MongoReviewRepository({ userRepo: user });
  const idempotency = new InMemoryIdempotencyRepository();
  const service = new MongoServiceRepository();
  const complaint = new MongoComplaintRepository();

  return { user, order, payment, earning, chat, idempotency, review, service, complaint };
}
