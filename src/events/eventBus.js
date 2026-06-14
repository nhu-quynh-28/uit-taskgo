import { childLogger } from "../utils/logger.js";

const log = childLogger({ module: "eventBus" });

export function createEventBus() {
  const listeners = new Map();

  function on(event, handler) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(handler);
    return () => listeners.get(event)?.delete(handler);
  }

  async function emitAsync(event, payload, meta = {}) {
    const envelope = {
      event,
      timestamp: new Date().toISOString(),
      correlationId: meta.correlationId ?? null,
      payload,
      meta,
    };

    const handlers = listeners.get(event);
    if (!handlers?.size) return envelope;

    const results = await Promise.allSettled(
      [...handlers].map((h) => Promise.resolve(h(envelope))),
    );

    for (const r of results) {
      if (r.status === "rejected") {
        log.error({ err: r.reason, event }, "Event handler failed");
      }
    }

    return envelope;
  }

  function emitDetached(event, payload, meta = {}) {
    emitAsync(event, payload, meta).catch((err) => {
      log.error({ err, event }, "Detached event handler failed");
    });
  }

  return { on, emitAsync, emitDetached };
}
