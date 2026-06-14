import { notFound } from "../../utils/AppError.js";
import { newId } from "../../utils/id.js";
import { User } from "../../models/User.model.js";
import { logMongoOp } from "./mongoLogger.js";
import { mapUser } from "./mappers.js";

export class MongoUserRepository {
  async seed(users) {
    for (const u of users) {
      await User.updateOne({ id: u.id }, { $setOnInsert: u }, { upsert: true });
    }
    logMongoOp("user", "seed", { count: users.length });
  }

  async findById(id) {
    const doc = await User.findOne({ id }).select("+passwordHash").lean();
    return mapUser(doc);
  }

  async findByIdOrFail(id) {
    const user = await this.findById(id);
    if (!user) throw notFound("User not found");
    return user;
  }

  async findByEmail(email) {
    const normalized = email.trim().toLowerCase();
    const doc = await User.findOne({ email: normalized }).select("+passwordHash").lean();
    return mapUser(doc);
  }

  async create(user) {
    const record = {
      ...user,
      id: user.id ?? newId(),
      email: user.email?.trim().toLowerCase(),
    };
    const doc = await User.create(record);
    logMongoOp("user", "create", { id: record.id });
    return mapUser(doc.toObject());
  }

  async update(id, patch) {
    const doc = await User.findOneAndUpdate(
      { id },
      { $set: patch },
      { new: true, runValidators: true },
    )
      .select("+passwordHash")
      .lean();
    if (!doc) throw notFound("User not found");
    logMongoOp("user", "update", { id });
    return mapUser(doc);
  }

  /**
   * Atomic running-average update for tasker review aggregates.
   */
  async applyReviewAggregate(taskerId, rating, session = null) {
    const opts = session ? { session } : {};
    const doc = await User.findOneAndUpdate(
      { id: taskerId, role: "tasker" },
      [
        {
          $set: {
            totalReviews: { $add: [{ $ifNull: ["$totalReviews", 0] }, 1] },
            averageRating: {
              $round: [
                {
                  $divide: [
                    {
                      $add: [
                        {
                          $multiply: [
                            { $ifNull: ["$averageRating", 0] },
                            { $ifNull: ["$totalReviews", 0] },
                          ],
                        },
                        rating,
                      ],
                    },
                    { $add: [{ $ifNull: ["$totalReviews", 0] }, 1] },
                  ],
                },
                2,
              ],
            },
          },
        },
      ],
      { new: true, runValidators: true, ...opts },
    ).lean();

    if (!doc) throw notFound("Tasker not found");
    logMongoOp("user", "applyReviewAggregate", { taskerId, rating });
    return mapUser(doc);
  }

  async findByRole(role) {
    const docs = await User.find({ role }).lean();
    return docs
      .map((doc) => {
        try {
          return mapUser(doc);
        } catch (err) {
          console.error("[MongoUserRepository.findByRole] mapUser failed", {
            role,
            userId: doc?.id,
            message: err?.message,
          });
          return null;
        }
      })
      .filter(Boolean);
  }

  async findOnlineTaskers() {
    const docs = await User.find({ role: "tasker", online: true }).lean();
    return docs.map(mapUser);
  }

  async setCurrentSocketId(userId, socketId) {
    return this.update(userId, { currentSocketId: socketId ?? null });
  }

  async clearCurrentSocketId(socketId) {
    const doc = await User.findOneAndUpdate(
      { currentSocketId: socketId },
      { $set: { currentSocketId: null } },
      { new: true },
    ).lean();
    return doc ? mapUser(doc) : null;
  }

  async updateTaskerLocation(userId, lng, lat) {
    return this.update(userId, {
      location: {
        type: "Point",
        coordinates: [Number(lng), Number(lat)],
      },
    });
  }

  /**
   * Online taskers within maxDistance (meters) offering serviceId, with active socket.
   */
  async findNearbyEligibleTaskers({ lng, lat, serviceId, maxDistanceMeters }) {
    const docs = await User.find({
      role: "tasker",
      online: true,
      services: serviceId,
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)],
          },
          $maxDistance: maxDistanceMeters,
        },
      },
    })
      .select("id currentSocketId name location online services")
      .lean();

    return docs.map(mapUser);
  }

  async count(filter = {}) {
    return User.countDocuments(filter);
  }
}
