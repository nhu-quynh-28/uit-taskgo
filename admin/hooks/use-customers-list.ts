import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { fetchCustomersForAdmin } from "@/lib/api/customers";
import { setCustomerAccountStatusForAdmin } from "@/lib/api/moderation";
import type { ModerationApplyResult } from "@/lib/api/adapters/moderation";
import type { AccountStatus, Customer } from "@/lib/mock-data";

export function useCustomersList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCustomersForAdmin();
      setCustomers(data);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load customers";
      setError(message);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setCustomerStatus = useCallback(
    async (id: string, status: AccountStatus): Promise<ModerationApplyResult> => {
      const previous = customers.find((c) => c.id === id);
      setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));

      try {
        const result = await setCustomerAccountStatusForAdmin(id, status);
        setCustomers((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: result.status } : c)),
        );
        return result;
      } catch (err) {
        if (previous) {
          setCustomers((prev) =>
            prev.map((c) => (c.id === id ? { ...c, status: previous.status } : c)),
          );
        }
        throw err;
      }
    },
    [customers],
  );

  return {
    customers,
    loading,
    error,
    reload: load,
    setCustomerStatus,
  };
}
