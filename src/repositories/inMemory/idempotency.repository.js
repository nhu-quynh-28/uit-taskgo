import { env } from "../../config/env.js";

export class InMemoryIdempotencyRepository {
  constructor() {
    this.records = new Map();
  }

  _key(key, route, userId) {
    return `${userId}:${route}:${key}`;
  }

  findValid(key, route, userId) {
    const record = this.records.get(this._key(key, route, userId));
    if (!record) return null;
    if (new Date(record.expiresAt).getTime() < Date.now()) {
      this.records.delete(this._key(key, route, userId));
      return null;
    }
    return record;
  }

  save({ key, route, userId, requestHash, statusCode, body }) {
    const expiresAt = new Date(Date.now() + env.idempotencyTtlMs).toISOString();
    const record = {
      key,
      route,
      userId,
      requestHash,
      statusCode,
      body,
      createdAt: new Date().toISOString(),
      expiresAt,
    };
    this.records.set(this._key(key, route, userId), record);
    return record;
  }
}
