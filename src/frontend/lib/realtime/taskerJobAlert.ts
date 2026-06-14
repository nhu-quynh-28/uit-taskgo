import type { Socket } from "socket.io-client";

export type NewJobAvailableOrder = {
  id: string;
  address?: string;
  notes?: string;
  subtotal?: number;
  serviceName?: string;
  pricing?: { total?: number; subtotal?: number } | null;
};

export type NewJobAvailablePayload = {
  type?: string;
  order?: NewJobAvailableOrder;
  radiusKm?: number;
};

export type ActiveJobAlert = {
  order: NewJobAvailableOrder;
  radiusKm: number;
};

export function formatJobEarnings(order: NewJobAvailableOrder): string {
  const amount = Number(order.pricing?.total ?? order.pricing?.subtotal ?? order.subtotal ?? 0);
  return `$${amount.toFixed(2)}`;
}

export function buildNewJobAlertMessage(order: NewJobAvailableOrder, radiusKm = 20): string {
  const address = order.address?.trim() || "Address not provided";
  const earnings = formatJobEarnings(order);
  const service = order.serviceName?.trim();
  const notes = order.notes?.trim();
  const lines = [
    service ? `Service: ${service}` : null,
    `Address: ${address}`,
    `Earnings: ${earnings}`,
    notes ? `Note: ${notes}` : null,
    `Within ${radiusKm} km of your location`,
  ].filter(Boolean);
  return lines.join("\n\n");
}

export type PresentNewJobAlertHandlers = {
  onPresent: (alert: ActiveJobAlert) => void;
  /** Skip duplicate banners for the same order within this window (ms). */
  dedupeMs?: number;
};

const recentAlerts = new Map<string, number>();

function shouldPresentAlert(orderId: string, dedupeMs: number): boolean {
  const now = Date.now();
  const last = recentAlerts.get(orderId);
  if (last != null && now - last < dedupeMs) return false;
  recentAlerts.set(orderId, now);
  if (recentAlerts.size > 50) {
    const cutoff = now - dedupeMs * 2;
    for (const [id, ts] of recentAlerts) {
      if (ts < cutoff) recentAlerts.delete(id);
    }
  }
  return true;
}

/** Clear dedupe cache when a job is revoked or dismissed so a re-broadcast can show again. */
export function clearJobAlertDedupe(orderId: string): void {
  recentAlerts.delete(orderId);
}

/** Queue in-app job alert (caller renders banner from AppContext state). */
export function presentNewJobAvailableAlert(
  payload: NewJobAvailablePayload,
  handlers: PresentNewJobAlertHandlers,
): void {
  const order = payload.order;
  if (!order?.id) return;

  const dedupeMs = handlers.dedupeMs ?? 8_000;
  if (!shouldPresentAlert(order.id, dedupeMs)) return;

  handlers.onPresent({
    order,
    radiusKm: payload.radiusKm ?? 20,
  });
}

export type TaskerJobAlertSyncHandlers = {
  onPayload: (payload: NewJobAvailablePayload) => void;
  prefetchOrder?: (orderId: string) => Promise<void>;
};

export function attachTaskerJobAlertSync(
  socket: Socket,
  handlers: TaskerJobAlertSyncHandlers,
): () => void {
  const onNewJobAvailable = (payload: NewJobAvailablePayload) => {
    const orderId = payload?.order?.id;
    if (orderId && handlers.prefetchOrder) {
      handlers.prefetchOrder(orderId).catch(() => undefined);
    }
    handlers.onPayload(payload);
  };

  socket.on("new_job_available", onNewJobAvailable);

  return () => {
    socket.off("new_job_available", onNewJobAvailable);
  };
}
