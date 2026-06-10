import { notFound } from "../../utils/AppError.js";
import { newId } from "../../utils/id.js";
import { isWithinRadiusKm } from "../../utils/geo.js";
import { locationToDto } from "../../schemas/common/location.schema.js";

export class InMemoryUserRepository {
  constructor() {
    this.users = new Map();
  }

  async seed(users) {
    users.forEach((u) => this.users.set(u.id, { ...u }));
  }

  async findById(id) {
    return this.users.get(id) ?? null;
  }

  async findByIdOrFail(id) {
    const user = await this.findById(id);
    if (!user) throw notFound("User not found");
    return user;
  }

  async findByEmail(email) {
    const normalized = email.trim().toLowerCase();
    for (const user of this.users.values()) {
      if (user.email === normalized) return user;
    }
    return null;
  }

  async create(user) {
    const record = { ...user, id: user.id ?? newId() };
    this.users.set(record.id, record);
    return record;
  }

  async update(id, patch) {
    const user = await this.findByIdOrFail(id);
    const updated = { ...user, ...patch, updatedAt: new Date().toISOString() };
    this.users.set(id, updated);
    return updated;
  }

  async applyReviewAggregate(taskerId, rating) {
    const tasker = await this.findByIdOrFail(taskerId);
    if (tasker.role !== "tasker") {
      throw notFound("Tasker not found");
    }
    const prevTotal = Number(tasker.totalReviews ?? 0);
    const prevAvg = Number(tasker.averageRating ?? 0);
    const nextTotal = prevTotal + 1;
    const nextAvg = (prevAvg * prevTotal + rating) / nextTotal;
    return this.update(taskerId, {
      averageRating: Math.round(nextAvg * 100) / 100,
      totalReviews: nextTotal,
    });
  }

  async findByRole(role) {
    return [...this.users.values()].filter((u) => u.role === role);
  }

  async findOnlineTaskers() {
    return [...this.users.values()].filter((u) => u.role === "tasker" && u.online);
  }

  async setCurrentSocketId(userId, socketId) {
    return this.update(userId, { currentSocketId: socketId ?? null });
  }

  async clearCurrentSocketId(socketId) {
    for (const user of this.users.values()) {
      if (user.currentSocketId === socketId) {
        return this.update(user.id, { currentSocketId: null });
      }
    }
    return null;
  }

  async updateTaskerLocation(userId, lng, lat) {
    return this.update(userId, {
      location: { type: "Point", coordinates: [Number(lng), Number(lat)] },
    });
  }

  async findNearbyEligibleTaskers({ lng, lat, serviceId, maxDistanceMeters }) {
    const radiusKm = maxDistanceMeters / 1000;
    const origin = { lat, lng };

    return [...this.users.values()]
      .filter((u) => {
        if (u.role !== "tasker" || !u.online) return false;
        if (!Array.isArray(u.services) || !u.services.includes(serviceId)) return false;
        const point = locationToDto(u.location);
        if (!point) return false;
        return isWithinRadiusKm(origin, point, radiusKm);
      })
      .map((u) => ({
        ...u,
        location: locationToDto(u.location),
      }));
  }

  async count(filter = {}) {
    return [...this.users.values()].filter((u) => {
      for (const [key, value] of Object.entries(filter)) {
        if (u[key] !== value) return false;
      }
      return true;
    }).length;
  }
}
