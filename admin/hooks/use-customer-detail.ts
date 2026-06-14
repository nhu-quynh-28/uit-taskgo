import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  fetchCustomerDetailForAdmin,
  fetchCustomerOrdersForAdmin,
} from "@/lib/api/customers";
import { setCustomerAccountStatusForAdmin } from "@/lib/api/moderation";
import type { ModerationApplyResult } from "@/lib/api/adapters/moderation";
import type { AccountStatus, Customer, Order } from "@/lib/mock-data";

export function useCustomerDetail(customerId: string) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setNotFound(false);
      setCustomer(null);
      setCustomerOrders([]);

      if (!customerId?.trim()) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const profile = await fetchCustomerDetailForAdmin(customerId);
        const orders = await fetchCustomerOrdersForAdmin(customerId, profile.name);
        if (!cancelled) {
          setCustomer(profile);
          setCustomerOrders(orders);
        }
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
              : "Failed to load customer";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  const setCustomerStatus = useCallback(
    async (status: AccountStatus): Promise<ModerationApplyResult | null> => {
      if (!customer) return null;

      const previous = customer;
      setCustomer((prev) => (prev ? { ...prev, status } : prev));

      try {
        const result = await setCustomerAccountStatusForAdmin(customer.id, status);
        setCustomer((prev) => (prev ? { ...prev, status: result.status } : prev));
        return result;
      } catch (err) {
        setCustomer(previous);
        throw err;
      }
    },
    [customer],
  );

  return {
    customer,
    customerOrders,
    loading,
    error,
    notFound,
    setCustomerStatus,
  };
}
