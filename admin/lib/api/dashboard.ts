import { DollarSign, ShoppingBag, Users, UserCheck } from "lucide-react";
import type { DashboardStat, Order, RevenueChartPoint } from "@/lib/mock-data";
import { apiRequest } from "./client";
import { mapApiOrderToOrder, type ApiOrder } from "./adapters/orders";

type DashboardApiOrder = ApiOrder & {
  customerName?: string;
  taskerName?: string;
};

type DashboardApiPayload = {
  stats?: Array<{
    label: string;
    value: string;
    delta?: number;
    tint?: DashboardStat["tint"];
  }>;
  recentOrders?: DashboardApiOrder[];
  revenueChart?: RevenueChartPoint[];
};

export type DashboardData = {
  stats: DashboardStat[];
  recentOrders: Order[];
  revenueChart: RevenueChartPoint[];
};

function mapRecentOrders(rows: DashboardApiOrder[] = []): Order[] {
  return rows.map((row) =>
    mapApiOrderToOrder(row, {
      customer: row.customerName ?? row.customerId,
      tasker: row.taskerId
        ? (row.taskerName ?? row.taskerId)
        : "Unassigned",
    }),
  );
}

function mapStats(
  stats: DashboardApiPayload["stats"],
): DashboardStat[] {
  if (!stats?.length) return [];
  return stats.map((s) => ({
    label: s.label,
    value: s.value,
    delta: s.delta,
    tint: s.tint,
    icon:
      s.tint === "info"
        ? ShoppingBag
        : s.tint === "accent"
          ? Users
          : s.tint === "warning"
            ? UserCheck
            : DollarSign,
  }));
}

/** Loads dashboard KPIs from GET /admin/dashboard. */
export async function fetchDashboardForAdmin(): Promise<DashboardData> {
  const data = await apiRequest<DashboardApiPayload>("/admin/dashboard", {
    allowLive: true,
  });

  const stats = mapStats(data.stats);
  if (!stats.length) {
    throw new Error("Dashboard response did not include stats");
  }

  return {
    stats,
    recentOrders: mapRecentOrders(data.recentOrders),
    revenueChart: data.revenueChart ?? [],
  };
}
