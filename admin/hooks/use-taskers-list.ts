import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { fetchTaskersForAdmin } from "@/lib/api/taskers";
import { setTaskerAccountStatusForAdmin } from "@/lib/api/moderation";
import type { ModerationApplyResult } from "@/lib/api/adapters/moderation";
import type { AccountStatus, Tasker } from "@/lib/mock-data";

export function useTaskersList() {
  const [taskers, setTaskers] = useState<Tasker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTaskersForAdmin();
      setTaskers(data);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load taskers";
      setError(message);
      setTaskers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setTaskerStatus = useCallback(
    async (id: string, status: AccountStatus): Promise<ModerationApplyResult> => {
      const previous = taskers.find((t) => t.id === id);
      setTaskers((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));

      try {
        const result = await setTaskerAccountStatusForAdmin(id, status);
        setTaskers((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: result.status } : t)),
        );
        return result;
      } catch (err) {
        if (previous) {
          setTaskers((prev) =>
            prev.map((t) => (t.id === id ? { ...t, status: previous.status } : t)),
          );
        }
        throw err;
      }
    },
    [taskers],
  );

  return {
    taskers,
    loading,
    error,
    reload: load,
    setTaskerStatus,
  };
}
