/** Fixed platform fee (USD) — demo-friendly constant pricing. */
export const PLATFORM_FEE = 5;

/** Additional fee when customer schedules ahead (USD). */
export const SCHEDULING_FEE = 5;

/**
 * @param {number} subtotal Service base price
 * @param {"instant"|"scheduled"|undefined} bookingType
 */
export function computeOrderPricing(subtotal, bookingType = "scheduled") {
  const base = Math.max(0, Number(subtotal) || 0);
  const schedulingFee = bookingType === "scheduled" ? SCHEDULING_FEE : 0;
  const platformFee = PLATFORM_FEE;
  const total = base + schedulingFee + platformFee;
  return {
    subtotal: base,
    schedulingFee,
    platformFee,
    total,
  };
}

/** Amount to charge the customer (supports legacy orders without pricing snapshot). */
export function getOrderChargeTotal(order) {
  if (order?.pricing?.total != null) {
    return Number(order.pricing.total);
  }
  const subtotal = Number(order?.subtotal) || 0;
  const bookingType = order?.bookingType ?? "scheduled";
  return computeOrderPricing(subtotal, bookingType).total;
}
