export function toAdminDashboardResponse(metrics) {
  const formatCurrency = (n) =>
    `$${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  return {
    totalUsers: metrics.totalUsers,
    totalCustomers: metrics.totalCustomers,
    totalTaskers: metrics.totalTaskers,
    verifiedTaskers: metrics.verifiedTaskers,
    pendingTaskers: metrics.pendingTaskers,
    blockedUsers: metrics.blockedUsers,
    totalOrders: metrics.totalOrders,
    activeOrders: metrics.activeOrders,
    completedOrders: metrics.completedOrders,
    cancelledOrders: metrics.cancelledOrders,
    totalRevenue: metrics.totalRevenue,
    activeServices: metrics.activeServices,
    revenueChart: metrics.revenueChart,
    recentOrders: metrics.recentOrders,
    stats: [
      {
        label: "Total revenue",
        value: formatCurrency(metrics.totalRevenue),
        tint: "primary",
      },
      {
        label: "Active orders",
        value: String(metrics.activeOrders),
        tint: "info",
      },
      {
        label: "Customers",
        value: metrics.totalCustomers.toLocaleString("en-US"),
        tint: "accent",
      },
      {
        label: "Taskers online",
        value: String(metrics.taskersOnline ?? metrics.verifiedTaskers),
        tint: "warning",
      },
    ],
  };
}
