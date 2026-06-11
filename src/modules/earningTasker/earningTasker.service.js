import { notFound } from "../../utils/AppError.js";

const PLATFORM_FEE_RATE = 0.15;
const TASKER_COMMISSION_RATE = 0.85;

export function createEarningTaskerService({ earningRepo }) {
  function calculateEarningForOrder(order) {
    const gross = Number(order.subtotal) || 0;
    const platformFee = Math.round(gross * PLATFORM_FEE_RATE * 100) / 100;
    const taskerNet = Math.round(gross * TASKER_COMMISSION_RATE * 100) / 100;
    return {
      gross,
      platformFee,
      taskerNet,
      rates: {
        platformFeeRate: PLATFORM_FEE_RATE,
        taskerCommissionRate: TASKER_COMMISSION_RATE,
      },
    };
  }

  async function recordEarningForCompletedOrder(order) {
    if (!order.taskerId) throw notFound("Order has no assigned tasker");

    const existing = await earningRepo.findByOrderId(order.id);
    if (existing) return existing;

    const breakdown = calculateEarningForOrder(order);
    return earningRepo.create({
      orderId: order.id,
      taskerId: order.taskerId,
      customerId: order.customerId,
      ...breakdown,
      status: "settled",
    });
  }

  async function getSummary(taskerId) {
    const records = await earningRepo.findByTaskerId(taskerId);
    const totalNet = records.reduce((s, r) => s + r.taskerNet, 0);
    return {
      taskerId,
      totalJobs: records.length,
      totalNet: Math.round(totalNet * 100) / 100,
      records,
    };
  }

  return { calculateEarningForOrder, recordEarningForCompletedOrder, getSummary };
}
