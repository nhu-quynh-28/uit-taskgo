import {
  ORDER_STATUS,
  PAYMENT_STATUS,
} from "../../config/constants.js";
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
} from "../../utils/AppError.js";
import { DomainEvents } from "../../events/domains/events.js";
import {
  buildRatingBreakdown,
  toReviewDTO,
  toTaskerStatsDTO,
} from "./review.dto.js";

export function createReviewService({ reviewRepo, orderRepo, userRepo, eventBus }) {
  function enrichReview(review) {
    return userRepo.findById(review.customerId).then((customer) =>
      toReviewDTO(review, customer),
    );
  }

  async function createReview(actor, { orderId, rating, comment }, correlationId) {
    if (actor.role !== "customer" && actor.role !== "admin") {
      throw forbidden("Only customers can submit reviews");
    }

    const order = await orderRepo.findByIdOrFail(orderId);

    if (actor.role === "customer" && order.customerId !== actor.id) {
      throw forbidden("Cannot review this order");
    }

    if (order.status !== ORDER_STATUS.COMPLETED) {
      throw badRequest("Reviews are only allowed for completed orders");
    }

    if (order.paymentStatus !== PAYMENT_STATUS.PAID) {
      throw badRequest("Reviews are only allowed after payment is completed");
    }

    if (!order.taskerId) {
      throw badRequest("Order has no assigned tasker");
    }

    if (await reviewRepo.findByOrderId(orderId)) {
      throw conflict("A review already exists for this order");
    }

    const { review, tasker: updatedTasker } = await reviewRepo.createWithTaskerAggregate({
      orderId,
      customerId: order.customerId,
      taskerId: order.taskerId,
      rating,
      comment: comment ?? "",
    });

    const reviewDto = await enrichReview(review);
    const taskerStats = toTaskerStatsDTO(updatedTasker);

    await eventBus.emitAsync(
      DomainEvents.REVIEW_CREATED,
      { review: reviewDto, taskerStats },
      { actorId: actor.id, correlationId },
    );

    return { review: reviewDto, taskerStats };
  }

  async function listTaskerReviews(taskerId) {
    await userRepo.findByIdOrFail(taskerId);
    const tasker = await userRepo.findById(taskerId);
    const reviews = await reviewRepo.findByTaskerId(taskerId);
    const enriched = await Promise.all(reviews.map((r) => enrichReview(r)));

    return {
      summary: {
        ...toTaskerStatsDTO(tasker),
        ratingBreakdown: buildRatingBreakdown(reviews),
      },
      reviews: enriched,
    };
  }

  async function listMyReviews(customerId) {
    const reviews = await reviewRepo.findByCustomerId(customerId);
    return Promise.all(reviews.map((r) => enrichReview(r)));
  }

  return {
    createReview,
    listTaskerReviews,
    listMyReviews,
  };
}
