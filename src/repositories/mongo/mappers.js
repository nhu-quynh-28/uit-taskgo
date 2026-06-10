import { locationToDto } from "../../schemas/common/location.schema.js";
import { mapKycDto } from "../../modules/user/kyc.dto.js";

function iso(value) {
  if (value == null) return undefined;
  if (value instanceof Date) return value.toISOString();
  return value;
}

function mapUnread(mapOrObj) {
  if (!mapOrObj) return {};
  if (mapOrObj instanceof Map) return Object.fromEntries(mapOrObj);
  return { ...mapOrObj };
}

export function mapUser(doc) {
  if (!doc) return null;
  const row = doc.toObject ? doc.toObject() : doc;
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role,
    name: row.name,
    phone: row.phone,
    avatar: row.avatar ?? null,
    online: row.online,
    location: locationToDto(row.location),
    currentSocketId: row.currentSocketId ?? null,
    savedAddresses: row.savedAddresses ?? [],
    averageRating: row.averageRating,
    totalReviews: row.totalReviews,
    accountStatus: row.accountStatus,
    verificationStatus: row.verificationStatus,
    kyc: mapKycDto(row.kyc),
    services: Array.isArray(row.services) ? [...row.services] : [],
    bio: row.bio ?? "",
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
    __v: row.__v,
  };
}

export function mapService(doc) {
  if (!doc) return null;
  const row = doc.toObject ? doc.toObject() : doc;
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    category: row.category,
    description: row.description ?? "",
    basePrice: row.basePrice ?? 0,
    durationLabel: row.durationLabel ?? "",
    estimatedDurationMinutes: row.estimatedDurationMinutes ?? null,
    active: row.active ?? true,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function mapComplaint(doc) {
  if (!doc) return null;
  const row = doc.toObject ? doc.toObject() : doc;
  return {
    id: row.id,
    subject: row.subject,
    customerId: row.customerId,
    taskerId: row.taskerId,
    orderId: row.orderId ?? null,
    category: row.category ?? "General",
    priority: row.priority,
    status: row.status,
    assignedTo: row.assignedTo ?? "Admin Team",
    adminNotes: row.adminNotes ?? "",
    resolvedBy: row.resolvedBy ?? null,
    resolvedAt: iso(row.resolvedAt),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function mapOrder(doc) {
  if (!doc) return null;
  const row = doc.toObject ? doc.toObject() : doc;
  return {
    id: row.id,
    customerId: row.customerId,
    taskerId: row.taskerId ?? null,
    serviceName: row.serviceName,
    address: row.address,
    scheduledAt: iso(row.scheduledAt) ?? row.scheduledAt,
    scheduledStartAt: iso(row.scheduledStartAt) ?? row.scheduledStartAt ?? undefined,
    scheduledEndAt: iso(row.scheduledEndAt) ?? row.scheduledEndAt ?? undefined,
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
    acceptedAt: iso(row.acceptedAt) ?? row.acceptedAt ?? undefined,
    completedAt: iso(row.completedAt) ?? row.completedAt ?? undefined,
    lastPaymentTraceId: row.lastPaymentTraceId ?? undefined,
    payosOrderCode: row.payosOrderCode ?? undefined,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
    __v: row.__v,
  };
}

export function mapThread(doc) {
  if (!doc) return null;
  const row = doc.toObject ? doc.toObject() : doc;
  return {
    id: row.id,
    orderId: row.orderId ?? null,
    participantKey: row.participantKey,
    participantIds: row.participantIds ?? [],
    latestMessage: row.latestMessage
      ? {
          id: row.latestMessage.id,
          text: row.latestMessage.text,
          senderId: row.latestMessage.senderId,
          createdAt: iso(row.latestMessage.createdAt),
        }
      : null,
    latestMessageAt: iso(row.latestMessageAt) ?? null,
    unreadByUser: mapUnread(row.unreadByUser),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function mapMessage(doc) {
  if (!doc) return null;
  const row = doc.toObject ? doc.toObject() : doc;
  return {
    id: row.id,
    threadId: row.threadId,
    senderId: row.senderId,
    text: row.text,
    createdAt: iso(row.createdAt),
  };
}

export function mapReview(doc) {
  if (!doc) return null;
  const row = doc.toObject ? doc.toObject() : doc;
  return {
    id: row.id,
    orderId: row.orderId,
    customerId: row.customerId,
    taskerId: row.taskerId,
    rating: row.rating,
    comment: row.comment ?? "",
    createdAt: iso(row.createdAt),
  };
}

export function mapPayment(doc) {
  if (!doc) return null;
  const row = doc.toObject ? doc.toObject() : doc;
  return {
    id: row.id,
    orderId: row.orderId,
    traceId: row.traceId,
    provider: row.provider,
    amount: row.amount,
    status: row.status,
    paidAt: iso(row.paidAt),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function mapTrace(doc) {
  if (!doc) return null;
  const row = doc.toObject ? doc.toObject() : doc;
  return {
    id: row.id,
    orderId: row.orderId,
    provider: row.provider,
    status: row.status,
    amount: row.amount,
    failureReason: row.failureReason ?? undefined,
    createdAt: iso(row.createdAt),
    completedAt: iso(row.completedAt) ?? undefined,
    attempts: row.attempts ?? [],
    updatedAt: iso(row.updatedAt),
  };
}

export function mapEarning(doc) {
  if (!doc) return null;
  const row = doc.toObject ? doc.toObject() : doc;
  return {
    id: row.id,
    orderId: row.orderId,
    taskerId: row.taskerId,
    customerId: row.customerId,
    gross: row.gross,
    platformFee: row.platformFee,
    taskerNet: row.taskerNet,
    rates: row.rates,
    status: row.status,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function parseDate(value) {
  if (!value) return undefined;
  return value instanceof Date ? value : new Date(value);
}
