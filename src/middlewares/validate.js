import { AppError } from "../utils/AppError.js";

export function validate(schema, source = "body") {
  return (req, _res, next) => {
    const { value, error } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        path: d.path.join("."),
        message: d.message,
      }));
      return next(
        new AppError("Validation failed", 400, "VALIDATION_ERROR", details),
      );
    }

    // Express 5 exposes read-only getters for `query` (and sometimes `params`).
    // Do not assign `req.query = value` — that throws and surfaces as HTTP 500.
    if (source === "query") {
      req.validatedQuery = value;
    } else if (source === "params") {
      req.validatedParams = value;
    } else {
      req[source] = value;
    }
    next();
  };
}
