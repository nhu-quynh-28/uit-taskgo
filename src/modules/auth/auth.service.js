import bcrypt from "bcryptjs";
import { signToken } from "../../config/jwt.js";
import { toGeoPoint } from "../../schemas/common/geoPoint.schema.js";
import { ROLES, ACCOUNT_STATUS, VERIFICATION_STATUS } from "../../config/constants.js";
import { badRequest, unauthorized, conflict } from "../../utils/AppError.js";
import { toUserDTO } from "./auth.dto.js";

export function createAuthService({ userRepo }) {
  async function getUserById(id) {
    return userRepo.findById(id);
  }

  async function register({ email, password, name, role, phone }) {
    if (!ROLES.includes(role) || role === "admin") {
      throw badRequest("Invalid role for self-registration");
    }
    if (await userRepo.findByEmail(email)) {
      throw conflict("Email already registered");
    }

    const user = await userRepo.create({
      email: email.trim().toLowerCase(),
      passwordHash: bcrypt.hashSync(password, 10),
      role,
      name,
      phone: phone || "",
      avatar: null,
      online: role === "tasker" ? false : undefined,
      location: toGeoPoint(-122.4194, 37.7749),
      accountStatus: ACCOUNT_STATUS.ACTIVE,
      verificationStatus:
        role === "tasker" ? VERIFICATION_STATUS.PENDING : VERIFICATION_STATUS.VERIFIED,
      createdAt: new Date().toISOString(),
    });

    const token = signToken({ sub: user.id, role: user.role });
    return { user: toUserDTO(user), token };
  }

  async function login({ email, password }) {
    const user = await userRepo.findByEmail(email);
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      throw unauthorized("Invalid email or password");
    }
    if (user.accountStatus === ACCOUNT_STATUS.BLOCKED) {
      throw unauthorized("Account is blocked");
    }
    const token = signToken({ sub: user.id, role: user.role });
    return { user: toUserDTO(user), token };
  }

  return { register, login, getUserById };
}
