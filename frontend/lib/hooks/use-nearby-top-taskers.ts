import { useCallback, useEffect, useState } from "react";
import {
  listMarketplaceTaskersRequest,
  toNearbyTopTaskers,
} from "@/lib/api/taskers";
import type { BookingWindow } from "@/lib/scheduling/bookingWindow";
import type { LatLng } from "@/lib/utils/distance";
import type { Tasker } from "@/screens/data";

export type UseNearbyTopTaskersResult = {
  taskers: Tasker[];
  loading: boolean;
  error: string | null;
  usesLocation: boolean;
  reload: () => Promise<void>;
};

export function useNearbyTopTaskers(
  customerLocation: LatLng | null | undefined,
  limit = 3,
  bookingWindow?: BookingWindow | null,
): UseNearbyTopTaskersResult {
  const [taskers, setTaskers] = useState<Tasker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const usesLocation = Boolean(
    customerLocation?.lat != null && customerLocation?.lng != null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params =
        bookingWindow?.startIso && bookingWindow?.endIso
          ? { scheduledStart: bookingWindow.startIso, scheduledEnd: bookingWindow.endIso }
          : undefined;
      const marketplace = await listMarketplaceTaskersRequest(params);
      setTaskers(toNearbyTopTaskers(marketplace, customerLocation, limit));
    } catch {
      setError("Could not load nearby taskers");
      setTaskers([]);
    } finally {
      setLoading(false);
    }
  }, [customerLocation?.lat, customerLocation?.lng, limit, bookingWindow?.startIso, bookingWindow?.endIso]);

  useEffect(() => {
    void load();
  }, [load]);

  return { taskers, loading, error, usesLocation, reload: load };
}
