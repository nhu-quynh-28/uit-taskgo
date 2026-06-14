import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { setTaskerAccountStatusForAdmin } from "@/lib/api/moderation";
import {
  fetchTaskerDetailForAdmin,
  rejectTaskerForAdmin,
  verifyTaskerForAdmin,
} from "@/lib/api/taskers";
import type { ModerationApplyResult } from "@/lib/api/adapters/moderation";
import type { AccountStatus, Tasker, VerificationStatus } from "@/lib/mock-data";

export function useTaskerDetail(taskerId: string) {
  const [tasker, setTasker] = useState<Tasker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setNotFound(false);
      setTasker(null);

      if (!taskerId?.trim()) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const data = await fetchTaskerDetailForAdmin(taskerId);
        console.log(">>> [ADMIN PANEL CHECK] Tasker sau khi map adapter:", data);
        console.log(">>> [ADMIN PANEL CHECK] tasker.kyc sau map:", data.kyc);
        if (!cancelled) setTasker(data);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && (err.status === 404 || err.code === "NOT_FOUND")) {
          setNotFound(true);
          return;
        }
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to load tasker";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [taskerId]);

  const setTaskerStatus = useCallback(
    async (status: AccountStatus): Promise<ModerationApplyResult | null> => {
      if (!tasker) return null;

      const previous = tasker;
      setTasker((prev) => (prev ? { ...prev, status } : prev));

      try {
        const result = await setTaskerAccountStatusForAdmin(tasker.id, status);
        setTasker((prev) => (prev ? { ...prev, status: result.status } : prev));
        return result;
      } catch (err) {
        setTasker(previous);
        throw err;
      }
    },
    [tasker],
  );

  const setTaskerVerification = useCallback(
    async (verified: VerificationStatus) => {
      if (!tasker) return null;

      const previous = tasker;
      setTasker((prev) => (prev ? { ...prev, verified } : prev));

      try {
        const updated =
          verified === "verified"
            ? await verifyTaskerForAdmin(tasker.id)
            : await rejectTaskerForAdmin(tasker.id);
        setTasker(updated);
        return updated;
      } catch (err) {
        setTasker(previous);
        throw err;
      }
    },
    [tasker],
  );

  return {
    tasker,
    loading,
    error,
    notFound,
    setTaskerStatus,
    setTaskerVerification,
  };
}
