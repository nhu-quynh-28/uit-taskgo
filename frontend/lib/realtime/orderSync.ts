import type { Socket } from "socket.io-client";
import type { OrderDTO } from "@/lib/api/types";

export type JobNoLongerAvailablePayload = {
  type?: string;
  orderId?: string;
};

export type OrderSyncHandlers = {
  mergeOrderDto: (dto: OrderDTO, options?: { force?: boolean }) => Promise<unknown>;
  removeMarketplaceOrder?: (orderId: string) => void;
  loadOrders: () => Promise<void>;
  fetchOrderById: (orderId: string) => Promise<OrderDTO>;
  isTasker: boolean;
  /** Shared dedup map (orderId → updatedAt ISO) */
  versionRef: { current: Map<string, string> };
};

/** Apply socket/REST order payload with updatedAt deduplication */
export function shouldApplyOrderUpdate(
  dto: OrderDTO,
  versionRef: { current: Map<string, string> },
  force?: boolean,
): boolean {
  const ts = dto.updatedAt ?? dto.createdAt ?? "";
  if (!dto.id) return false;
  if (force) {
    if (ts) versionRef.current.set(dto.id, ts);
    return true;
  }
  if (!ts) return true;
  const prev = versionRef.current.get(dto.id);
  if (prev && prev >= ts) return false;
  versionRef.current.set(dto.id, ts);
  return true;
}

/**
 * Subscribe to marketplace realtime events. Caller must invoke returned teardown on logout/unmount.
 */
export function attachOrderSync(socket: Socket, handlers: OrderSyncHandlers): () => void {
  const applyDto = (dto: OrderDTO | undefined, force?: boolean) => {
    if (!dto?.id) return;
    if (!shouldApplyOrderUpdate(dto, handlers.versionRef, force)) return;
    handlers.mergeOrderDto(dto, { force }).catch(() => undefined);
  };

  const onStatus = (payload: { order?: OrderDTO }) => applyDto(payload?.order);
  const onAssigned = (payload: { order?: OrderDTO }) => applyDto(payload?.order);
  const onPaymentFailed = (payload: { order?: OrderDTO }) => applyDto(payload?.order);

  const prefetchOrderForTasker = (orderId: string | undefined) => {
    if (!handlers.isTasker || !orderId) return;
    handlers
      .fetchOrderById(orderId)
      .then((full) => applyDto(full, true))
      .catch(() => undefined);
  };

  const onNewOrder = (payload: { order?: { id: string } }) => {
    prefetchOrderForTasker(payload?.order?.id);
  };

  const onNewJobAvailable = (payload: { order?: { id: string } }) => {
    prefetchOrderForTasker(payload?.order?.id);
  };

  const onJobNoLongerAvailable = (payload: JobNoLongerAvailablePayload) => {
    if (!handlers.isTasker || !payload?.orderId) return;
    handlers.versionRef.current.delete(payload.orderId);
    handlers.removeMarketplaceOrder?.(payload.orderId);
  };

  const refetchOrders = () => {
    handlers.loadOrders().catch(() => undefined);
  };

  const onConnect = () => refetchOrders();
  const onAck = () => refetchOrders();

  socket.on("connection:ack", onAck);
  socket.on("connect", onConnect);
  socket.on("new_order", onNewOrder);
  socket.on("new_job_available", onNewJobAvailable);
  socket.on("job_no_longer_available", onJobNoLongerAvailable);
  socket.on("order_status_updated", onStatus);
  socket.on("tasker_assigned", onAssigned);
  socket.on("payment_failed", onPaymentFailed);

  return () => {
    socket.off("connection:ack", onAck);
    socket.off("connect", onConnect);
    socket.off("new_order", onNewOrder);
    socket.off("new_job_available", onNewJobAvailable);
    socket.off("job_no_longer_available", onJobNoLongerAvailable);
    socket.off("order_status_updated", onStatus);
    socket.off("tasker_assigned", onAssigned);
    socket.off("payment_failed", onPaymentFailed);
  };
}
