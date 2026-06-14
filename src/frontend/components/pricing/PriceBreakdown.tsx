import React from "react";
import { View, Text } from "react-native";
import type { OrderPricing } from "@/lib/pricing/orderPricing";

type PriceRowProps = {
  label: string;
  value: string;
  bold?: boolean;
};

function PriceRow({ label, value, bold }: PriceRowProps) {
  return (
    <View className="flex-row justify-between items-center">
      <Text className={bold ? "font-black text-base" : "text-sm text-muted-foreground"}>
        {label}
      </Text>
      <Text className={bold ? "font-black text-lg text-primary" : "font-bold text-sm"}>
        {value}
      </Text>
    </View>
  );
}

type PriceBreakdownProps = {
  pricing: OrderPricing;
  showDivider?: boolean;
};

export function PriceBreakdown({ pricing, showDivider = true }: PriceBreakdownProps) {
  return (
    <View className="gap-y-3">
      <PriceRow label="Service Fee" value={`$${pricing.subtotal}`} />
      {pricing.schedulingFee > 0 ? (
        <PriceRow label="Scheduling Fee" value={`$${pricing.schedulingFee}`} />
      ) : null}
      <PriceRow label="Platform Fee" value={`$${pricing.platformFee}`} />
      {showDivider ? <View className="h-px bg-border my-1" /> : null}
      <PriceRow label="Total" value={`$${pricing.total}`} bold />
    </View>
  );
}
