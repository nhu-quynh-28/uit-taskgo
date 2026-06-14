export function toReviewDTO(review, customer) {
  return {
    id: review.id,
    orderId: review.orderId,
    customerId: review.customerId,
    taskerId: review.taskerId,
    rating: review.rating,
    comment: review.comment ?? "",
    createdAt: review.createdAt,
    customer: customer
      ? {
          id: customer.id,
          name: customer.name,
          avatar: customer.avatar ?? null,
        }
      : null,
  };
}

export function toTaskerStatsDTO(user) {
  return {
    averageRating: Number(user.averageRating ?? 0),
    totalReviews: Number(user.totalReviews ?? 0),
  };
}

export function buildRatingBreakdown(reviews) {
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const review of reviews) {
    const key = review.rating;
    if (breakdown[key] !== undefined) breakdown[key] += 1;
  }
  return breakdown;
}
