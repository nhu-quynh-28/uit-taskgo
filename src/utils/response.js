function meta(req) {
  return {
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  };
}

export function sendSuccess(res, req, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    meta: meta(req),
  });
}

export function sendCreated(res, req, data) {
  return sendSuccess(res, req, data, 201);
}

export function sendError(res, req, { statusCode, code, message, details, data }) {
  const body = {
    success: false,
    error: { code, message, details: details ?? undefined },
    meta: meta(req),
  };
  if (data !== undefined) body.data = data;
  return res.status(statusCode).json(body);
}

export function sendPaymentFailed(res, req, { message, order, trace, retryable }) {
  return sendError(res, req, {
    statusCode: 402,
    code: "PAYMENT_FAILED",
    message,
    data: { order, trace, retryable },
  });
}
