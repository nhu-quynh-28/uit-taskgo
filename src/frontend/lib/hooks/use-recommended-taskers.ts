import { useCallback, useEffect, useState } from "react";
import {
  listMarketplaceTaskersRequest,
  toRecommendedTaskers,
} from "@/lib/api/taskers";
import type { BookingWindow } from "@/lib/scheduling/bookingWindow";
import type { Tasker } from "@/screens/data";

export type UseRecommendedTaskersResult = {
  taskers: Tasker[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useRecommendedTaskers(
  limit = 5,
  bookingWindow?: BookingWindow | null,
): UseRecommendedTaskersResult {
  const [taskers, setTaskers] = useState<Tasker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params =
        bookingWindow?.startIso && bookingWindow?.endIso
          ? { scheduledStart: bookingWindow.startIso, scheduledEnd: bookingWindow.endIso }
          : undefined;
      const marketplace = await listMarketplaceTaskersRequest(params);
      setTaskers(toRecommendedTaskers(marketplace, limit));
    } catch {
      setError("Could not load recommended taskers");
      setTaskers([]);
    } finally {
      setLoading(false);
    }
  }, [limit, bookingWindow?.startIso, bookingWindow?.endIso]);

  useEffect(() => {
    void load();
  }, [load]);

  return { taskers, loading, error, reload: load };
}
