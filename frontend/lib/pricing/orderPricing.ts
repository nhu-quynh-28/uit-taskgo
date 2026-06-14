export const PLATFORM_FEE = 5;
export const SCHEDULING_FEE = 5;

export type OrderPricing = {
  subtotal: number;
  schedulingFee: number;
  platformFee: number;
  total: number;
};

export function computeOrderPricing(
  subtotal: number,
  bookingType: "instant" | "scheduled" = "scheduled",
): OrderPricing {
  const base = Math.max(0, Number(subtotal) || 0);
  const schedulingFee = bookingType === "scheduled" ? SCHEDULING_FEE : 0;
  const platformFee = PLATFORM_FEE;
  return {
    subtotal: base,
    schedulingFee,
    platformFee,
    total: base + schedulingFee + platformFee,
  };
}

export function resolveOrderPricing(input: {
  subtotal: number;
  bookingType?: "instant" | "scheduled";
  pricing?: OrderPricing | null;
}): OrderPricing {
  if (input.pricing) return input.pricing;
  return computeOrderPricing(input.subtotal, input.bookingType ?? "scheduled");
}
