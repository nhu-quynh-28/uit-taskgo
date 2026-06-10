import { locationToDto } from "../common/location.schema.js";
import { normalizeRefId } from "./objectId.js";

function iso(value) {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  return value;
}

import { mapKycDto } from "../../modules/user/kyc.dto.js";

/** Mirrors auth.dto.js toUserDTO — strips passwordHash */
export function leanUserToDto(doc) {
  if (!doc) return null;
  const row = doc.toObject ? doc.toObject() : doc;
  const {
    passwordHash: _ph,
    _id: _mongoId,
    __v: _v,
    location,
    kyc: _kyc,
    ...safe
  } = row;

  return {
    ...safe,
    id: row.id,
    email: row.email,
    role: row.role,
    name: row.name,
    phone: row.phone,
    avatar: row.avatar ?? null,
    online: row.online,
    location: locationToDto(location),
    averageRating: row.averageRating,
    totalReviews: row.totalReviews,
    accountStatus: row.accountStatus,
    verificationStatus: row.verificationStatus,
    kyc: mapKycDto(row.kyc),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

/** Mirrors order.dto.js toOrderDTO */
export function leanOrderToDto(doc) {
  if (!doc) return null;
  const row = doc.toObject ? doc.toObject() : doc;
  return {
    id: row.id,
    customerId: normalizeRefId(row.customerId),
    taskerId: row.taskerId ? normalizeRefId(row.taskerId) : null,
    serviceName: row.serviceName,
    address: row.address,
    scheduledAt: iso(row.scheduledAt) ?? row.scheduledAt,
    scheduledStartAt: iso(row.scheduledStartAt) ?? row.scheduledStartAt,
    scheduledEndAt: iso(row.scheduledEndAt) ?? row.scheduledEndAt,
    bookingType: row.bookingType ?? "scheduled",
    serviceId: row.serviceId ?? null,
    estimatedDurationMinutes: row.estimatedDurationMinutes ?? null,
    notes: row.notes ?? "",
    subtotal: row.subtotal,
    pricing: row.pricing
      ? {
          subtotal: row.pricing.subtotal,
          schedulingFee: row.pricing.schedulingFee,
          platformFee: row.pricing.platformFee,
          total: row.pricing.total,
        }
      : undefined,
    status: row.status,
    paymentStatus: row.paymentStatus,
    location: locationToDto(row.location),
    acceptedAt: iso(row.acceptedAt),
    completedAt: iso(row.completedAt),
    lastPaymentTraceId: row.lastPaymentTraceId ?? undefined,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

/** Mirrors chat.dto.js toMessageDTO */
export function leanMessageToDto(doc) {
  if (!doc) return null;
  const row = doc.toObject ? doc.toObject() : doc;
  return {
    id: row.id,
    threadId: normalizeRefId(row.threadId),
    senderId: normalizeRefId(row.senderId),
    text: row.text,
    createdAt: iso(row.createdAt),
  };
}

function latestMessageToDto(latest) {
  if (!latest) return null;
  return {
    id: latest.id,
    text: latest.text,
    senderId: normalizeRefId(latest.senderId),
    createdAt: iso(latest.createdAt),
  };
}

/** Mirrors chat.dto.js toThreadDTO */
export function leanThreadToDto(doc, viewerUserId, otherParticipant = null) {
  if (!doc) return null;
  const row = doc.toObject ? doc.toObject() : doc;
  const unreadMap = row.unreadByUser instanceof Map
    ? Object.fromEntries(row.unreadByUser)
    : row.unreadByUser ?? {};
  const unreadCount = unreadMap[viewerUserId] ?? 0;

  return {
    id: row.id,
    orderId: row.orderId ?? null,
    participantIds: (row.participantIds ?? []).map(normalizeRefId),
    latestMessage: latestMessageToDto(row.latestMessage),
    latestMessageAt: iso(row.latestMessageAt) ?? null,
    unreadCount,
    createdAt: iso(row.createdAt),
    otherParticipant,
  };
}

/** Mirrors review.dto.js toReviewDTO */
export function leanReviewToDto(doc, customer = null) {
  if (!doc) return null;
  const row = doc.toObject ? doc.toObject() : doc;
  return {
    id: row.id,
    orderId: normalizeRefId(row.orderId),
    customerId: normalizeRefId(row.customerId),
    taskerId: normalizeRefId(row.taskerId),
    rating: row.rating,
    comment: row.comment ?? "",
    createdAt: iso(row.createdAt),
    customer: customer
      ? {
          id: customer.id,
          name: customer.name,
          avatar: customer.avatar ?? null,
        }
      : null,
  };
}

export function leanTaskerStatsFromUser(doc) {
  if (!doc) return { averageRating: 0, totalReviews: 0 };
  const row = doc.toObject ? doc.toObject() : doc;
  return {
    averageRating: Number(row.averageRating ?? 0),
    totalReviews: Number(row.totalReviews ?? 0),
  };
}

/** Payment record as returned in payment events */
export function leanPaymentToDto(doc) {
  if (!doc) return null;
  const row = doc.toObject ? doc.toObject() : doc;
  return {
    id: row.id,
    orderId: normalizeRefId(row.orderId),
    traceId: row.traceId,
    provider: row.provider,
    amount: row.amount,
    status: row.status,
    paidAt: iso(row.paidAt),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

/** Payment trace (PayOS mock / provider audit) */
export function leanPaymentTraceToDto(doc) {
  if (!doc) return null;
  const row = doc.toObject ? doc.toObject() : doc;
  return {
    id: row.id,
    orderId: normalizeRefId(row.orderId),
    provider: row.provider,
    status: row.status,
    amount: row.amount,
    failureReason: row.failureReason,
    createdAt: iso(row.createdAt),
    completedAt: iso(row.completedAt),
    attempts: row.attempts ?? [],
  };
}

/** Earning record for tasker settlements */
export function leanEarningRecordToDto(doc) {
  if (!doc) return null;
  const row = doc.toObject ? doc.toObject() : doc;
  return {
    id: row.id,
    orderId: normalizeRefId(row.orderId),
    taskerId: normalizeRefId(row.taskerId),
    customerId: normalizeRefId(row.customerId),
    gross: row.gross,
    platformFee: row.platformFee,
    taskerNet: row.taskerNet,
    rates: row.rates,
    status: row.status,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}
