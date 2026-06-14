import type { ReviewDTO, TaskerReviewsResponseDTO } from "@/lib/api/reviews";
import type { Order } from "@/screens/AppContext";

export type CustomerReviewItem = {
  id: string;
  orderId: string;
  taskerId: string;
  serviceName: string;
  rating: number;
  text: string;
  tags: string[];
  date: string;
};

export type TaskerReviewListItem = {
  id: string;
  customerName: string;
  customerAvatar: string | null;
  rating: number;
  comment: string;
  date: string;
};

function formatReviewDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function reviewDtoToCustomerReview(
  dto: ReviewDTO,
  orders: Order[],
): CustomerReviewItem {
  const order = orders.find((o) => o.id === dto.orderId);
  return {
    id: dto.id,
    orderId: dto.orderId,
    taskerId: dto.taskerId,
    serviceName: order?.service.name ?? "Service",
    rating: dto.rating,
    text: dto.comment ?? "",
    tags: [],
    date: formatReviewDate(dto.createdAt),
  };
}

export function reviewDtoToTaskerListItem(dto: ReviewDTO): TaskerReviewListItem {
  return {
    id: dto.id,
    customerName: dto.customer?.name ?? "Customer",
    customerAvatar: dto.customer?.avatar ?? null,
    rating: dto.rating,
    comment: dto.comment ?? "",
    date: formatReviewDate(dto.createdAt),
  };
}

export function canReviewOrder(
  order: Order | undefined,
  reviewedOrderIds: Set<string>,
): boolean {
  if (!order?.taskerId && !order?.tasker) return false;
  if (reviewedOrderIds.has(order.id)) return false;
  return order.apiStatus === "completed" && order.paymentStatus === "paid";
}

export type TaskerReviewsView = {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: Record<number, number>;
  reviews: TaskerReviewListItem[];
};

export function mapTaskerReviewsResponse(
  data: TaskerReviewsResponseDTO,
): TaskerReviewsView {
  return {
    averageRating: data.summary.averageRating,
    totalReviews: data.summary.totalReviews,
    ratingBreakdown: data.summary.ratingBreakdown,
    reviews: data.reviews.map(reviewDtoToTaskerListItem),
  };
}
