import { notFound } from "../../utils/AppError.js";
import { newId } from "../../utils/id.js";
import { Service } from "../../models/Service.model.js";
import { logMongoOp } from "./mongoLogger.js";
import { mapService } from "./mappers.js";

export class MongoServiceRepository {
  async seed(services) {
    for (const s of services) {
      await Service.updateOne({ id: s.id }, { $setOnInsert: s }, { upsert: true });
    }
    logMongoOp("service", "seed", { count: services.length });
  }

  async listAll() {
    const docs = await Service.find().sort({ name: 1 }).lean();
    return docs.map(mapService);
  }

  async findById(id) {
    const doc = await Service.findOne({ id }).lean();
    return mapService(doc);
  }

  async findByIdOrFail(id) {
    const row = await this.findById(id);
    if (!row) throw notFound("Service not found");
    return row;
  }

  async create(payload) {
    const record = { ...payload, id: payload.id ?? newId() };
    const doc = await Service.create(record);
    logMongoOp("service", "create", { id: record.id });
    return mapService(doc.toObject());
  }

  async update(id, patch) {
    const doc = await Service.findOneAndUpdate(
      { id },
      { $set: patch },
      { new: true, runValidators: true },
    ).lean();
    if (!doc) throw notFound("Service not found");
    logMongoOp("service", "update", { id });
    return mapService(doc);
  }

  async delete(id) {
    const doc = await Service.findOneAndDelete({ id }).lean();
    if (!doc) throw notFound("Service not found");
    logMongoOp("service", "delete", { id });
    return mapService(doc);
  }

  async countActive() {
    return Service.countDocuments({ active: true });
  }
}
