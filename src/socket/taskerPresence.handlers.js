import { toGeoPoint } from "../schemas/common/geoPoint.schema.js";

/**
 * Tasker real-time presence: socket id, online toggle, live GPS updates.
 */
export function registerTaskerPresenceHandlers(socket, { userRepo, userService }) {
  const authUser = socket.data.user;

  socket.on("register_session", async (payload, ack) => {
    try {
      const userId =
        typeof payload === "string" ? payload : payload?.userId ?? authUser.id;

      if (userId !== authUser.id) {
        ack?.({ success: false, error: "Forbidden" });
        return;
      }

      await userRepo.setCurrentSocketId(userId, socket.id);
      ack?.({ success: true, socketId: socket.id });
    } catch (err) {
      ack?.({ success: false, error: err?.message ?? "register_session failed" });
    }
  });

  socket.on("toggle_online", async (payload, ack) => {
    try {
      const userId = payload?.userId ?? authUser.id;
      const isOnline = Boolean(payload?.isOnline);

      if (userId !== authUser.id) {
        ack?.({ success: false, error: "Forbidden" });
        return;
      }

      if (authUser.role !== "tasker") {
        ack?.({ success: false, error: "Only taskers can toggle online status" });
        return;
      }

      const updated = await userService.setTaskerOnline(userId, isOnline);
      ack?.({ success: true, online: updated.online });
    } catch (err) {
      ack?.({ success: false, error: err?.message ?? "toggle_online failed" });
    }
  });

  socket.on("update_location", async (payload, ack) => {
    try {
      const userId = payload?.userId ?? authUser.id;
      const lng = Number(payload?.lng);
      const lat = Number(payload?.lat);

      if (userId !== authUser.id) {
        ack?.({ success: false, error: "Forbidden" });
        return;
      }

      if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
        ack?.({ success: false, error: "Invalid lng/lat" });
        return;
      }

      const updated = await userRepo.updateTaskerLocation(userId, lng, lat);
      ack?.({
        success: true,
        location: updated.location ?? toGeoPoint(lng, lat),
      });
    } catch (err) {
      ack?.({ success: false, error: err?.message ?? "update_location failed" });
    }
  });
}
