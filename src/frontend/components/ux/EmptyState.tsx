import React, { ReactNode } from "react";
import { Text, View } from "react-native";
import { PrimaryButton } from "@/screens/ui";

export type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: EmptyStateProps) {
  return (
    <View className="items-center justify-center py-16 px-8">
      <View className="w-20 h-20 rounded-[28px] bg-muted/80 items-center justify-center mb-5">
        {icon}
      </View>
      <Text className="font-black text-lg text-foreground text-center">{title}</Text>
      {description ? (
        <Text className="text-sm text-muted-foreground text-center mt-2 leading-5 max-w-[280px]">
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View className="w-full max-w-xs mt-6">
          <PrimaryButton onClick={onAction}>{actionLabel}</PrimaryButton>
        </View>
      ) : null}
      {secondaryLabel && onSecondary ? (
        <Text
          onPress={onSecondary}
          className="text-sm font-bold text-primary mt-4"
        >
          {secondaryLabel}
        </Text>
      ) : null}
    </View>
  );
}
