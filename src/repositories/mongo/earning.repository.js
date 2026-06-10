import { newId } from "../../utils/id.js";
import { EarningRecord } from "../../models/EarningRecord.model.js";
import { logMongoOp } from "./mongoLogger.js";
import { mapEarning } from "./mappers.js";

export class MongoEarningRepository {
  async create(record) {
    const doc = await EarningRecord.create({
      id: newId(),
      ...record,
    });
    logMongoOp("earning", "create", { id: doc.id, orderId: record.orderId });
    return mapEarning(doc.toObject());
  }

  async findByTaskerId(taskerId) {
    const docs = await EarningRecord.find({ taskerId }).lean();
    return docs.map(mapEarning);
  }

  async findByOrderId(orderId) {
    const doc = await EarningRecord.findOne({ orderId }).lean();
    return mapEarning(doc);
  }
}
