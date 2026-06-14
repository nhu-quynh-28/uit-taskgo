import { seedInMemoryRepositories } from "../seed/runner.js";
import { InMemoryUserRepository } from "../repositories/inMemory/user.repository.js";
import { InMemoryOrderRepository } from "../repositories/inMemory/order.repository.js";
import { InMemoryPaymentRepository } from "../repositories/inMemory/payment.repository.js";
import { InMemoryEarningRepository } from "../repositories/inMemory/earning.repository.js";
import { InMemoryChatRepository } from "../repositories/inMemory/chat.repository.js";
import { InMemoryIdempotencyRepository } from "../repositories/inMemory/idempotency.repository.js";
import { InMemoryReviewRepository } from "../repositories/inMemory/review.repository.js";
import { InMemoryServiceRepository } from "../repositories/inMemory/service.repository.js";
import { InMemoryComplaintRepository } from "../repositories/inMemory/complaint.repository.js";
import { createMongoRepositories } from "../repositories/mongo/index.js";
import { seedMongoIfEmpty } from "../repositories/mongo/seed.js";
import { connectMongo, isMongoConnected } from "./database.js";
import { env } from "./env.js";
import { childLogger } from "../utils/logger.js";

const log = childLogger({ module: "repositories" });

let repositories = null;

function createInMemoryRepositories() {
  const user = new InMemoryUserRepository();
  const order = new InMemoryOrderRepository();
  const payment = new InMemoryPaymentRepository();
  const earning = new InMemoryEarningRepository();
  const chat = new InMemoryChatRepository();
  const idempotency = new InMemoryIdempotencyRepository();
  const review = new InMemoryReviewRepository(user);
  const service = new InMemoryServiceRepository();
  const complaint = new InMemoryComplaintRepository();

  log.info({ driver: "inMemory" }, "In-memory repositories initialized");
  return { user, order, payment, earning, chat, idempotency, review, service, complaint };
}


function createMongoRepositorySet() {
  const repos = createMongoRepositories();
  log.info({ driver: "mongodb" }, "MongoDB repositories initialized");
  return repos;
}

/**
 * Initialize persistence layer (call once before createApp when using MongoDB).
 */
export async function initializeRepositories() {
  if (repositories) return repositories;

  if (env.repositoryDriver === "mongo") {
    if (!env.mongodbUri) {
      throw new Error("REPOSITORY_DRIVER=mongo requires MONGODB_URI");
    }
    if (!isMongoConnected()) {
      await connectMongo();
    }
    await seedMongoIfEmpty();
    repositories = createMongoRepositorySet();
  } else {
    repositories = createInMemoryRepositories();
    await seedInMemoryRepositories(repositories);
  }

  return repositories;
}

export function getRepositories() {
  if (!repositories) {
    throw new Error(
      "Repositories are not initialized. Call initializeRepositories() or resetRepositoriesForTests() first.",
    );
  }
  return repositories;
}

export async function resetRepositoriesForTests() {
  repositories = null;
  if (env.repositoryDriver === "mongo") {
    return initializeRepositories();
  }
  repositories = createInMemoryRepositories();
  await seedInMemoryRepositories(repositories);
  return repositories;
}
