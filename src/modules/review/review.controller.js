import { sendCreated, sendSuccess } from "../../utils/response.js";

export function createReviewController(reviewService) {
  const correlation = (req) => req.requestId;

  return {
    async create(req, res) {
      const result = await reviewService.createReview(
        req.user,
        {
          orderId: req.body.orderId,
          rating: req.body.rating,
          comment: req.body.comment,
        },
        correlation(req),
      );
      return sendCreated(res, req, result);
    },
    async listTaskerReviews(req, res) {
      return sendSuccess(res, req, await reviewService.listTaskerReviews(req.params.taskerId));
    },
    async listMine(req, res) {
      return sendSuccess(res, req, await reviewService.listMyReviews(req.user.id));
    },
  };
}
