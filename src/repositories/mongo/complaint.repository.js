import { notFound } from "../../utils/AppError.js";
import { newId } from "../../utils/id.js";
import { Complaint } from "../../models/Complaint.model.js";
import { logMongoOp } from "./mongoLogger.js";
import { mapComplaint } from "./mappers.js";

export class MongoComplaintRepository {
  async seed(complaints) {
    for (const c of complaints) {
      await Complaint.updateOne({ id: c.id }, { $setOnInsert: c }, { upsert: true });
    }
    logMongoOp("complaint", "seed", { count: complaints.length });
  }

  async listAll() {
    const docs = await Complaint.find().sort({ createdAt: -1 }).lean();
    return docs.map(mapComplaint);
  }

  async findById(id) {
    const doc = await Complaint.findOne({ id }).lean();
    return mapComplaint(doc);
  }

  async findByIdOrFail(id) {
    const row = await this.findById(id);
    if (!row) throw notFound("Complaint not found");
    return row;
  }

  async create(payload) {
    const record = { ...payload, id: payload.id ?? newId() };
    const doc = await Complaint.create(record);
    logMongoOp("complaint", "create", { id: record.id });
    return mapComplaint(doc.toObject());
  }

  async update(id, patch) {
    const doc = await Complaint.findOneAndUpdate(
      { id },
      { $set: patch },
      { new: true, runValidators: true },
    ).lean();
    if (!doc) throw notFound("Complaint not found");
    logMongoOp("complaint", "update", { id });
    return mapComplaint(doc);
  }
}
