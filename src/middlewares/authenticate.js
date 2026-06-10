import { verifyToken } from "../config/jwt.js";
import { ACCOUNT_STATUS } from "../config/constants.js";
import { forbidden, unauthorized } from "../utils/AppError.js";

export function createAuthenticateMiddleware(getUserById) {
  return async function authenticate(req, _res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return next(unauthorized("Missing or malformed Authorization header"));
    }

    const token = header.slice(7).trim();
    if (!token) return next(unauthorized("Missing bearer token"));

    try {
      const decoded = verifyToken(token);
      const user = await getUserById(decoded.sub);
      if (!user) return next(unauthorized("User no longer exists"));
      if (user.accountStatus === ACCOUNT_STATUS.BLOCKED) {
        return next(forbidden("Account is blocked"));
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        accountStatus: user.accountStatus,
        verificationStatus: user.verificationStatus,
      };
      req.log = req.log?.child({ userId: user.id, role: user.role });
      next();
    } catch {
      next(unauthorized("Invalid or expired token"));
    }
  };
}
