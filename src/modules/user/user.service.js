import {
  ACCOUNT_STATUS,
  VERIFICATION_STATUS,
} from "../../config/constants.js";
import { forbidden, notFound, badRequest } from "../../utils/AppError.js";
import { toUserDTO } from "../auth/auth.dto.js";
import { normalizeUserLocationInput } from "../../schemas/common/location.schema.js";
import { isTaskerAvailableForWindow } from "../../scheduling/overlap.js";

export function createUserService({ userRepo, orderRepo }) {
  async function getProfile(userId) {
    const user = await userRepo.findById(userId);
    if (!user) throw notFound("User not found");
    return toUserDTO(user);
  }

  async function updateProfile(actorId, actorRole, targetId, updates) {
    if (actorId !== targetId && actorRole !== "admin") {
      throw forbidden("Cannot update another user's profile");
    }

    const target = await userRepo.findById(targetId);
    if (!target) throw notFound("User not found");

    if (target.role === "tasker") {
      if (updates.online !== undefined && actorId !== targetId && actorRole !== "admin") {
        throw forbidden("Cannot change another tasker's online status");
      }
    }

    if (actorRole !== "admin") {
      delete updates.accountStatus;
      delete updates.verificationStatus;
    }

    const patch = buildProfilePatch(target, updates);
    const user = await userRepo.update(targetId, patch);
    return toUserDTO(user);
  }

  function buildProfilePatch(target, updates) {
    const { dob, address, services, location, ...rest } = updates;
    const patch = { ...rest };

    if (location !== undefined) {
      patch.location = normalizeUserLocationInput(location);
    }

    if (services !== undefined) {
      patch.services = services;
    }

    const shouldTouchKyc =
      target.role === "tasker" &&
      (dob !== undefined || address !== undefined || patch.phone !== undefined);

    if (shouldTouchKyc) {
      const existing = target.kyc ?? {};
      patch.kyc = {
        ...existing,
        ...(dob !== undefined ? { dob: String(dob).trim() } : {}),
        ...(address !== undefined ? { address: String(address).trim() } : {}),
        ...(patch.phone !== undefined ? { phone: String(patch.phone).trim() } : {}),
      };
    }

    return patch;
  }

  async function listTaskers({ scheduledStart, scheduledEnd } = {}) {
    const rows = await userRepo.findByRole("tasker");
    const taskers = rows
      .filter(Boolean)
      .map((row) => {
        try {
          return toUserDTO(row);
        } catch (mapErr) {
          console.error("[listTaskers] Skipping tasker — DTO mapping failed", {
            taskerId: row?.id,
            message: mapErr?.message,
          });
          return null;
        }
      })
      .filter(Boolean);

    if (!scheduledStart || !scheduledEnd || !orderRepo) {
      return taskers;
    }

    const windowStart = new Date(scheduledStart);
    const windowEnd = new Date(scheduledEnd);
    if (Number.isNaN(windowStart.getTime()) || Number.isNaN(windowEnd.getTime())) {
      return taskers;
    }

    let orders = [];
    try {
      orders = await orderRepo.listAll();
    } catch (orderErr) {
      console.error("[listTaskers] Could not load orders for availability filter", {
        message: orderErr?.message,
        scheduledStart,
        scheduledEnd,
      });
      return taskers;
    }

    return taskers.filter((t) =>
      isTaskerAvailableForWindow(orders, t.id, windowStart, windowEnd),
    );
  }

  async function setTaskerOnline(taskerId, online) {
    const user = await userRepo.findByIdOrFail(taskerId);
    if (user.role !== "tasker") throw notFound("Tasker not found");
    return toUserDTO(await userRepo.update(taskerId, { online }));
  }

  async function assertRole(userId, role) {
    const user = await userRepo.findByIdOrFail(userId);
    if (user.role !== role) throw notFound(`${role} not found`);
    return user;
  }

  async function blockUser(userId, expectedRole) {
    const user = await assertRole(userId, expectedRole);
    if (user.accountStatus === ACCOUNT_STATUS.BLOCKED) {
      return toUserDTO(user);
    }
    return toUserDTO(
      await userRepo.update(userId, { accountStatus: ACCOUNT_STATUS.BLOCKED }),
    );
  }

  async function unblockUser(userId, expectedRole) {
    const user = await assertRole(userId, expectedRole);
    return toUserDTO(
      await userRepo.update(userId, { accountStatus: ACCOUNT_STATUS.ACTIVE }),
    );
  }

  async function submitKyc(userId, kycData) {
    const user = await userRepo.findByIdOrFail(userId);
    if (user.role !== "tasker") {
      throw badRequest("Only taskers can submit KYC documents");
    }
    if (user.verificationStatus === VERIFICATION_STATUS.VERIFIED) {
      throw badRequest("Your account is already verified");
    }

    const submittedAt = new Date();
    const kyc = {
      fullName: kycData.fullName.trim(),
      dob: kycData.dob.trim(),
      address: kycData.address.trim(),
      phone: kycData.phone.trim(),
      cccdFront: kycData.cccdFront,
      cccdBack: kycData.cccdBack,
      submittedAt,
    };

    const updated = await userRepo.update(userId, {
      kyc,
      verificationStatus: VERIFICATION_STATUS.PENDING,
      name: kyc.fullName,
      phone: kyc.phone,
    });

    return toUserDTO(updated);
  }

  async function verifyTasker(taskerId) {
    await assertRole(taskerId, "tasker");
    return toUserDTO(
      await userRepo.update(taskerId, { verificationStatus: VERIFICATION_STATUS.VERIFIED }),
    );
  }

  async function rejectTasker(taskerId) {
    await assertRole(taskerId, "tasker");
    return toUserDTO(
      await userRepo.update(taskerId, { verificationStatus: VERIFICATION_STATUS.REJECTED }),
    );
  }

  async function assertCustomerCanBook(customerId) {
    const user = await userRepo.findByIdOrFail(customerId);
    if (user.role !== "customer") {
      throw badRequest("Only customers can create orders");
    }
    if (user.accountStatus === ACCOUNT_STATUS.BLOCKED) {
      throw forbidden("Customer account is blocked");
    }
    return user;
  }

  async function assertAccountActive(userId) {
    const user = await userRepo.findByIdOrFail(userId);
    if (user.accountStatus === ACCOUNT_STATUS.BLOCKED) {
      throw forbidden("Account is blocked");
    }
    return user;
  }

  async function assertTaskerCanPerformJob(taskerId) {
    const user = await userRepo.findByIdOrFail(taskerId);
    if (user.role !== "tasker") {
      throw notFound("Tasker not found");
    }
    if (user.accountStatus === ACCOUNT_STATUS.BLOCKED) {
      throw forbidden("Tasker account is blocked");
    }
    return user;
  }

  async function assertTaskerCanAcceptJobs(taskerId) {
    const user = await userRepo.findByIdOrFail(taskerId);
    if (user.role !== "tasker") {
      throw notFound("Tasker not found");
    }
    if (user.accountStatus === ACCOUNT_STATUS.BLOCKED) {
      throw forbidden("Tasker account is blocked");
    }
    if (user.verificationStatus !== VERIFICATION_STATUS.VERIFIED) {
      throw forbidden("Tasker is not verified");
    }
    return user;
  }

  return {
    getProfile,
    updateProfile,
    listTaskers,
    setTaskerOnline,
    blockUser,
    unblockUser,
    submitKyc,
    verifyTasker,
    rejectTasker,
    assertAccountActive,
    assertCustomerCanBook,
    assertTaskerCanAcceptJobs,
    assertTaskerCanPerformJob,
  };
}
