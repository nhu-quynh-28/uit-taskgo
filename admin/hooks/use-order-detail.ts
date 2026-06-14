import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { fetchOrderDetailForAdmin, type OrderDetail } from "@/lib/api/order-detail";

export function useOrderDetail(orderId: string) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setNotFound(false);
      setOrder(null);

      if (!orderId?.trim()) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const data = await fetchOrderDetailForAdmin(orderId);
        if (!cancelled) setOrder(data);
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
              : "Failed to load order";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return { order, loading, error, notFound };
}
