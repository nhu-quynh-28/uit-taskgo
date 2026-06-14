import type { Socket } from "socket.io-client";
import type { CreateReviewResultDTO } from "@/lib/api/reviews";

export type ReviewSyncHandlers = {
  onReviewCreated: (payload: {
    type: "review_created";
    review: CreateReviewResultDTO["review"];
    taskerStats: CreateReviewResultDTO["taskerStats"];
  }) => void;
  refreshMyReviews: () => Promise<void>;
  refreshTaskerReviews: (taskerId: string) => Promise<void>;
  activeTaskerProfileIdRef: { current?: string };
  authUserId?: string;
};

export function attachReviewSync(socket: Socket, handlers: ReviewSyncHandlers): () => void {
  const onReviewCreated = (payload: {
    type?: string;
    review?: CreateReviewResultDTO["review"];
    taskerStats?: CreateReviewResultDTO["taskerStats"];
  }) => {
    if (!payload?.review) return;
    handlers.onReviewCreated({
      type: "review_created",
      review: payload.review,
      taskerStats: payload.taskerStats ?? { averageRating: 0, totalReviews: 0 },
    });

    handlers.refreshMyReviews().catch(() => undefined);

    const taskerId = payload.review.taskerId;
    if (
      handlers.activeTaskerProfileIdRef.current &&
      handlers.activeTaskerProfileIdRef.current === taskerId
    ) {
      handlers.refreshTaskerReviews(taskerId).catch(() => undefined);
    }

    if (handlers.authUserId === taskerId) {
      handlers.refreshTaskerReviews(taskerId).catch(() => undefined);
    }
  };

  socket.on("review_created", onReviewCreated);

  return () => {
    socket.off("review_created", onReviewCreated);
  };
}
