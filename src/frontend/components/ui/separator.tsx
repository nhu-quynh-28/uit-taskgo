import React from "react";
import { View } from "react-native";
import { cn } from '@/components/lib/utils';

type SeparatorProps = {
  orientation?: "horizontal" | "vertical";
  className?: string;
};

export function Separator({
  orientation = "horizontal",
  className,
}: SeparatorProps) {
  return (
    <View
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal"
          ? "h-[1px] w-full"
          : "h-full w-[1px]",
        className
      )}
    />
  );
}