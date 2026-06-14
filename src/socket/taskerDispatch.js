import { env } from "../config/env.js";
import * as connectionManager from "./connectionManager.js";

const METERS_PER_KM = 1000;

async function findEligibleTaskersForOrder(userRepo, order) {
  const origin = order.location;
  const serviceId = order.serviceId;

  if (!origin?.lat || !origin?.lng || !serviceId) {
    return [];
  }

  const maxDistanceMeters = Math.round(env.nearbyTaskerRadiusKm * METERS_PER_KM);
  return userRepo.findNearbyEligibleTaskers({
    lng: origin.lng,
    lat: origin.lat,
    serviceId,
    maxDistanceMeters,
  });
}

function emitToTaskerSockets(io, tasker, event, payload) {
  let sent = false;

  if (tasker.currentSocketId) {
    io.to(tasker.currentSocketId).emit(event, payload);
    sent = true;
  }

  const fallbackSockets = connectionManager.getSocketIdsForUser(tasker.id);
  for (const sid of fallbackSockets) {
    if (sid !== tasker.currentSocketId) {
      io.to(sid).emit(event, payload);
      sent = true;
    }
  }

  return sent;
}

/**
 * Notify eligible online taskers within radius via Socket.io.
 * Uses Mongo $nearSphere when available; falls back to in-memory haversine filter.
 *
 * @param {import('socket.io').Server} io
 * @param {import('../repositories/mongo/user.repository.js').MongoUserRepository | import('../repositories/inMemory/user.repository.js').InMemoryUserRepository} userRepo
 * @param {object} order — order DTO (toOrderDTO shape)
 */
export async function dispatchNewJobAvailable(io, userRepo, order) {
  const taskers = await findEligibleTaskersForOrder(userRepo, order);
  if (taskers.length === 0) {
    if (!order.location?.lat || !order.location?.lng) {
      return { matched: 0, emitted: 0, skipped: "missing_order_location" };
    }
    if (!order.serviceId) {
      return { matched: 0, emitted: 0, skipped: "missing_service_id" };
    }
    return { matched: 0, emitted: 0, maxDistanceMeters: Math.round(env.nearbyTaskerRadiusKm * METERS_PER_KM) };
  }

  let emitted = 0;
  const payload = {
    type: "new_job_available",
    order: {
      id: order.id,
      customerId: order.customerId,
      serviceId: order.serviceId,
      serviceName: order.serviceName,
      address: order.address,
      scheduledAt: order.scheduledAt,
      subtotal: order.subtotal,
      pricing: order.pricing,
      location: order.location,
      status: order.status,
    },
    radiusKm: env.nearbyTaskerRadiusKm,
  };

  for (const tasker of taskers) {
    if (emitToTaskerSockets(io, tasker, "new_job_available", payload)) {
      emitted += 1;
    }
  }

  return {
    matched: taskers.length,
    emitted,
    maxDistanceMeters: Math.round(env.nearbyTaskerRadiusKm * METERS_PER_KM),
  };
}

/**
 * Revoke marketplace job alerts for nearby taskers after another tasker claims the order.
 *
 * @param {import('socket.io').Server} io
 * @param {import('../repositories/mongo/user.repository.js').MongoUserRepository | import('../repositories/inMemory/user.repository.js').InMemoryUserRepository} userRepo
 * @param {object} order — order DTO (toOrderDTO shape)
 * @param {{ excludeTaskerId: string }} options
 */
export async function dispatchJobNoLongerAvailable(io, userRepo, order, { excludeTaskerId }) {
  const taskers = await findEligibleTaskersForOrder(userRepo, order);
  if (taskers.length === 0) {
    return { matched: 0, emitted: 0, skipped: "no_eligible_taskers" };
  }

  const payload = {
    type: "job_no_longer_available",
    orderId: order.id,
  };

  let emitted = 0;
  for (const tasker of taskers) {
    if (tasker.id === excludeTaskerId) continue;
    if (emitToTaskerSockets(io, tasker, "job_no_longer_available", payload)) {
      emitted += 1;
    }
  }

  return { matched: taskers.length, emitted };
}
