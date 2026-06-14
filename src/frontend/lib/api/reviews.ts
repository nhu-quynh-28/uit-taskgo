import { apiRequest } from "./client";

export type ReviewCustomerDTO = {
  id: string;
  name: string;
  avatar: string | null;
};

export type ReviewDTO = {
  id: string;
  orderId: string;
  customerId: string;
  taskerId: string;
  rating: number;
  comment: string;
  createdAt: string;
  customer: ReviewCustomerDTO | null;
};

export type TaskerReviewStatsDTO = {
  averageRating: number;
  totalReviews: number;
};

export type TaskerReviewsResponseDTO = {
  summary: TaskerReviewStatsDTO & {
    ratingBreakdown: Record<1 | 2 | 3 | 4 | 5, number>;
  };
  reviews: ReviewDTO[];
};

export type CreateReviewResultDTO = {
  review: ReviewDTO;
  taskerStats: TaskerReviewStatsDTO;
};

export async function createReviewRequest(input: {
  orderId: string;
  rating: number;
  comment?: string;
}): Promise<CreateReviewResultDTO> {
  const { data } = await apiRequest<CreateReviewResultDTO>("post", "/reviews", {
    body: input,
  });
  return data;
}

export async function listMyReviewsRequest(): Promise<ReviewDTO[]> {
  const { data } = await apiRequest<ReviewDTO[]>("get", "/reviews/me");
  return data;
}

export async function listTaskerReviewsRequest(
  taskerId: string,
): Promise<TaskerReviewsResponseDTO> {
  const { data } = await apiRequest<TaskerReviewsResponseDTO>("get", `/reviews/tasker/${taskerId}`, {
    config: { skipAuth: true },
  });
  return data;
}
