import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { fetchComplaintsForAdmin } from "@/lib/api/complaints";
import type { Complaint } from "@/lib/mock-data";

export function useComplaintsList() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchComplaintsForAdmin();
      setComplaints(rows);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load complaints";
      setError(message);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    complaints,
    loading,
    error,
    reload: load,
  };
}
