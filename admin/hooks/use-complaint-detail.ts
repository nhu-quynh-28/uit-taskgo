import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  fetchComplaintDetailForAdmin,
  updateComplaintStatusForAdmin,
} from "@/lib/api/complaints";
import type { Complaint } from "@/lib/mock-data";

export function useComplaintDetail(complaintId: string) {
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setNotFound(false);
      setComplaint(null);

      if (!complaintId?.trim()) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const row = await fetchComplaintDetailForAdmin(complaintId);
        if (!cancelled) setComplaint(row);
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
              : "Failed to load complaint";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [complaintId]);

  const updateComplaint = useCallback(
    async (patch: Partial<Complaint>) => {
      if (!complaint) return null;
      setSaving(true);
      try {
        const updated = await updateComplaintStatusForAdmin(complaint.id, {
          status: (patch.status ?? complaint.status) as Complaint["status"],
          adminNotes: patch.adminNotes,
          assignedTo: patch.assigned,
        });
        setComplaint(updated);
        return updated;
      } finally {
        setSaving(false);
      }
    },
    [complaint],
  );

  return {
    complaint,
    loading,
    error,
    notFound,
    saving,
    updateComplaint,
  };
}
