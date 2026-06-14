import { forbidden } from "../utils/AppError.js";

export function requireRoles(...roles) {
  const allowed = new Set(roles);
  return (req, _res, next) => {
    if (!req.user) return next(forbidden("Authentication required"));
    if (!allowed.has(req.user.role)) {
      return next(forbidden(`Role '${req.user.role}' is not permitted`));
    }
    next();
  };
}
