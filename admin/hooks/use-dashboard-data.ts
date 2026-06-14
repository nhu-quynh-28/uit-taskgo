import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { fetchDashboardForAdmin } from "@/lib/api/dashboard";
import type { DashboardStat, Order, RevenueChartPoint } from "@/lib/mock-data";

export function useDashboardData() {
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [revenueChart, setRevenueChart] = useState<RevenueChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardForAdmin();
      setStats(data.stats);
      setRecentOrders(data.recentOrders);
      setRevenueChart(data.revenueChart);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load dashboard";
      setError(message);
      setStats([]);
      setRecentOrders([]);
      setRevenueChart([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    stats,
    recentOrders,
    revenueChart,
    loading,
    error,
    reload: load,
  };
}
