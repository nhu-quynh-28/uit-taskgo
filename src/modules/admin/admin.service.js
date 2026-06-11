import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  ACCOUNT_STATUS,
  VERIFICATION_STATUS,
} from "../../config/constants.js";
import { toOrderDTO } from "../order/order.dto.js";

const ACTIVE_ORDER_STATUSES = new Set([
  ORDER_STATUS.PENDING,
  ORDER_STATUS.ACCEPTED,
  ORDER_STATUS.ARRIVED,
  ORDER_STATUS.IN_PROGRESS,
  ORDER_STATUS.PENDING_PAYMENT,
]);

export function createAdminService({ userRepo, orderRepo, serviceRepo, paymentRepo }) {
  async function getDashboard() {
    // Fire all independent counts in parallel — no full collection loads.
    const [
      totalUsers,
      totalCustomers,
      totalTaskers,
      verifiedTaskers,
      pendingTaskers,
      blockedUsers,
      activeServices,
      statusCounts,
      recentSlice,
      chartData,
      taskersOnlineCount,
    ] = await Promise.all([
      userRepo.count({}),
      userRepo.count({ role: "customer" }),
      userRepo.count({ role: "tasker" }),
      userRepo.count({ role: "tasker", verificationStatus: VERIFICATION_STATUS.VERIFIED }),
      userRepo.count({ role: "tasker", verificationStatus: VERIFICATION_STATUS.PENDING }),
      userRepo.count({ accountStatus: ACCOUNT_STATUS.BLOCKED }),
      serviceRepo.countActive(),
      orderRepo.countByStatus(),
      orderRepo.findRecent(5),
      orderRepo.monthlyRevenueChart(),
      userRepo.count({ role: "tasker", online: true }),
    ]);

    const totalOrders = Object.values(statusCounts).reduce((s, n) => s + n, 0);
    const activeOrders = [...ACTIVE_ORDER_STATUSES].reduce((s, st) => s + (statusCounts[st] ?? 0), 0);
    const completedOrders = statusCounts[ORDER_STATUS.COMPLETED] ?? 0;
    const cancelledOrders = statusCounts[ORDER_STATUS.CANCELLED] ?? 0;

    let totalRevenue = 0;
    if (paymentRepo?.sumSucceededAmount) {
      try {
        totalRevenue = await paymentRepo.sumSucceededAmount();
      } catch {
        totalRevenue = await orderRepo.sumPaidRevenue();
      }
    } else {
      totalRevenue = await orderRepo.sumPaidRevenue();
    }

    const revenueChart = buildMonthlyChart(chartData);

    const nameIds = new Set(recentSlice.flatMap((o) => [o.customerId, o.taskerId].filter(Boolean)));
    const nameMap = new Map();
    await Promise.all(
      [...nameIds].map(async (id) => {
        const user = await userRepo.findById(id);
        if (user) nameMap.set(id, user.name);
      }),
    );
    const recentOrders = recentSlice.map((o) => ({
      ...toOrderDTO(o),
      customerName: nameMap.get(o.customerId) ?? o.customerId,
      taskerName: o.taskerId ? (nameMap.get(o.taskerId) ?? o.taskerId) : "Unassigned",
    }));

    return {
      totalUsers,
      totalCustomers,
      totalTaskers,
      verifiedTaskers,
      pendingTaskers,
      blockedUsers,
      totalOrders,
      activeOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
      activeServices,
      revenueChart,
      recentOrders,
      taskersOnline: taskersOnlineCount,
    };
  }

  return { getDashboard };
}

/** Convert aggregation pipeline output to chart format. */
function buildMonthlyChart(aggRows) {
  return aggRows.map(({ _id, revenue, orders }) => {
    // _id is "YYYY-MM"; convert to short month name for UI compatibility.
    const date = new Date(_id + "-01");
    const month = Number.isNaN(date.getTime())
      ? _id
      : date.toLocaleString("en-US", { month: "short" });
    return { month, revenue: Math.round(revenue), orders };
  });
}
